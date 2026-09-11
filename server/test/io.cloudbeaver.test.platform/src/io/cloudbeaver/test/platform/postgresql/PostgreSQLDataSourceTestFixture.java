/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.test.platform.postgresql;

import io.cloudbeaver.WebSessionGlobalProjectImpl;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.test.WebGQLClient;
import io.cloudbeaver.test.platform.util.GraphQLTestClientWrapper;
import io.cloudbeaver.test.platform.util.GraphQLTestConstant;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.navigator.DBNProject;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;

import java.sql.Connection;
import java.sql.Driver;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.UUID;

public final class PostgreSQLDataSourceTestFixture implements AutoCloseable {
    public static final String DRIVER_ID = "postgresql:postgres-jdbc";

    private static final String ENV_HOST = "CLOUDBEAVER_TEST_POSTGRES_HOST";
    private static final String ENV_PORT = "CLOUDBEAVER_TEST_POSTGRES_PORT";
    private static final String ENV_DATABASE = "CLOUDBEAVER_TEST_POSTGRES_DATABASE";
    private static final String ENV_USER = "CLOUDBEAVER_TEST_POSTGRES_USER";
    // nosemgrep: codacy.java.security.hard-coded-password
    private static final String ENV_PASSWORD = "CLOUDBEAVER_TEST_POSTGRES_PASSWORD";
    private static final String DEFAULT_HOST = "127.0.0.1";
    private static final String DEFAULT_PORT = "5432";
    private static final String DEFAULT_DATABASE = "cloudbeaver_test";
    private static final String DEFAULT_USER = "cloudbeaver_test";
    private static final String DEFAULT_PASSWORD = DEFAULT_USER;

    private static final String GQL_NAV_NODE_CHILDREN = """
        query navNodeChildren($parentPath: ID!) {
          result: navNodeChildren(parentPath: $parentPath) {
            uri
            name
            plainName
            nodeType
            folder
            inline
            object {
              name
              type
              ordinalPosition
              features
            }
          }
        }
        """;
    private static final String GQL_SQL_CONTEXT_CREATE = """
        mutation sqlContextCreate(
          $projectId: ID,
          $connectionId: ID!,
          $defaultCatalog: String,
          $defaultSchema: String
        ) {
          result: sqlContextCreate(
            projectId: $projectId,
            connectionId: $connectionId,
            defaultCatalog: $defaultCatalog,
            defaultSchema: $defaultSchema
          ) {
            id
          }
        }
        """;
    private static final String GQL_SQL_RESULT_CLOSE = """
        mutation sqlResultClose($projectId: ID, $connectionId: ID!, $contextId: ID!, $resultId: ID!) {
          result: sqlResultClose(
            projectId: $projectId,
            connectionId: $connectionId,
            contextId: $contextId,
            resultId: $resultId
          )
        }
        """;
    private static final String GQL_SQL_CONTEXT_DESTROY = """
        mutation sqlContextDestroy($projectId: ID, $connectionId: ID!, $contextId: ID!) {
          result: sqlContextDestroy(projectId: $projectId, connectionId: $connectionId, contextId: $contextId)
        }
        """;
    private static final String GQL_ASYNC_UPDATE_RESULTS = """
        mutation asyncUpdateResultsDataBatch(
          $projectId: ID!,
          $connectionId: ID!,
          $contextId: ID!,
          $resultsId: ID!,
          $updatedRows: [SQLResultRow!],
          $deletedRows: [SQLResultRow!],
          $addedRows: [SQLResultRow!]
        ) {
          result: asyncUpdateResultsDataBatch(
            projectId: $projectId,
            connectionId: $connectionId,
            contextId: $contextId,
            resultsId: $resultsId,
            updatedRows: $updatedRows,
            deletedRows: $deletedRows,
            addedRows: $addedRows
          ) {
            id
          }
        }
        """;
    private static final String GQL_ASYNC_GENERATE_ENTITY_QUERY = """
        mutation asyncSqlGenerateEntityQuery(
          $generatorId: String!,
          $nodePathList: [String!]!,
          $generatorOptions: SQLQueryGeneratorOptions
        ) {
          result: asyncSqlGenerateEntityQuery(
            generatorId: $generatorId,
            nodePathList: $nodePathList,
            generatorOptions: $generatorOptions
          ) {
            id
          }
        }
        """;

    @NotNull
    private final WebGQLClient client;
    @NotNull
    private final GraphQLTestClientWrapper clientWrapper;
    @NotNull
    private final DBRProgressMonitor monitor = new LoggingProgressMonitor();
    @NotNull
    private final Set<String> taskIds = new LinkedHashSet<>();
    @NotNull
    private final Map<String, Set<String>> resultIds = new LinkedHashMap<>();
    @NotNull
    private final Set<String> contextIds = new LinkedHashSet<>();

    private PostgreSQLConnectionConfig config;
    private String schemaName;
    private Driver jdbcDriver;
    private String sessionId;
    private boolean ownsSession;
    private WebSession webSession;
    private WebSessionGlobalProjectImpl globalProject;
    private DBPDataSourceContainer dataSourceContainer;
    private WebConnectionInfo webConnectionInfo;

    private PostgreSQLDataSourceTestFixture(@NotNull WebGQLClient client) {
        this.client = client;
        this.clientWrapper = new GraphQLTestClientWrapper(client);
    }

    @NotNull
    public static PostgreSQLDataSourceTestFixture setUp(@NotNull WebGQLClient client) throws Exception {
        return setUp(client, null);
    }

    @NotNull
    public static PostgreSQLDataSourceTestFixture setUp(
        @NotNull WebGQLClient client,
        @Nullable String existingSessionId
    ) throws Exception {
        PostgreSQLDataSourceTestFixture fixture = new PostgreSQLDataSourceTestFixture(client);
        try {
            fixture.initialize(existingSessionId);
            return fixture;
        } catch (Exception e) {
            try {
                fixture.close();
            } catch (Exception cleanupError) {
                e.addSuppressed(cleanupError);
            }
            throw e;
        }
    }

    private void initialize(@Nullable String existingSessionId) throws Exception {
        config = PostgreSQLConnectionConfig.fromEnvironment();
        schemaName = "cb_pg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        DBPDriver driver = DataSourceProviderRegistry.getInstance().findDriver(DRIVER_ID);
        if (driver == null) {
            throw new DBException("Could not find PostgreSQL driver: " + DRIVER_ID);
        }
        Object driverInstance = driver.getDefaultDriverLoader().getDriverInstance(monitor);
        if (!(driverInstance instanceof Driver sqlDriver)) {
            throw new DBException("PostgreSQL driver does not implement java.sql.Driver");
        }
        jdbcDriver = sqlDriver;
        prepareSchema();

        ownsSession = existingSessionId == null;
        sessionId = ownsSession ? clientWrapper.openSession() : existingSessionId;
        webSession = resolveWebSession(sessionId);
        globalProject = webSession.getGlobalProject();
        if (globalProject == null) {
            throw new DBException("Global project is not configured");
        }

        DBPConnectionConfiguration connectionConfiguration = new DBPConnectionConfiguration();
        connectionConfiguration.setHostName(config.host());
        connectionConfiguration.setHostPort(config.port());
        connectionConfiguration.setDatabaseName(config.database());
        connectionConfiguration.setUrl(config.schemaJdbcUrl(schemaName));
        connectionConfiguration.setUserName(config.user());
        connectionConfiguration.setUserPassword(config.password());

        DataSourceDescriptor descriptor = globalProject.getDataSourceRegistry().createDataSource(
            DataSourceDescriptor.generateNewId(driver),
            driver,
            connectionConfiguration
        );
        descriptor.setName("PostgreSQL datasource test " + schemaName);
        descriptor.setSavePassword(true);
        descriptor.setTemporary(true);
        dataSourceContainer = descriptor;
        descriptor.connect(monitor, true, true);
        globalProject.getDataSourceRegistry().addDataSource(descriptor);
        webConnectionInfo = globalProject.addConnection(descriptor);

        DBNProject projectNode = webSession.getNavigatorModelOrThrow().getRoot().getProjectNode(globalProject);
        if (projectNode == null) {
            throw new DBException("Project navigator node not found");
        }
        projectNode.getDatabases().getChildren(monitor);
        if (webConnectionInfo.getNodePath() == null) {
            throw new DBException("PostgreSQL connection navigator node not found");
        }
    }

    private void prepareSchema() throws Exception {
        try (Connection connection = openJdbcConnection(); Statement statement = connection.createStatement()) {
            connection.setAutoCommit(false);
            statement.execute("CREATE SCHEMA " + quotedSchema());
            statement.execute("""
                CREATE TABLE %s.parent_table (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    code TEXT NOT NULL,
                    note TEXT,
                    CONSTRAINT parent_code_unique UNIQUE (code)
                )
                """.formatted(quotedSchema()));
            statement.execute("""
                CREATE TABLE %s.child_table (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    parent_id BIGINT NOT NULL,
                    name TEXT NOT NULL,
                    note TEXT,
                    CONSTRAINT child_parent_fk FOREIGN KEY (parent_id) REFERENCES %s.parent_table(id)
                )
                """.formatted(quotedSchema(), quotedSchema()));
            statement.execute("""
                CREATE TABLE %s.edit_rows (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    name TEXT NOT NULL,
                    note TEXT
                )
                """.formatted(quotedSchema()));
            statement.execute("""
                CREATE TABLE %s.type_values (
                    id INTEGER PRIMARY KEY,
                    uuid_value UUID NOT NULL,
                    json_value JSONB NOT NULL,
                    bytes_value BYTEA NOT NULL,
                    timestamp_value TIMESTAMPTZ NOT NULL,
                    numeric_value NUMERIC(30, 10) NOT NULL,
                    boolean_value BOOLEAN NOT NULL,
                    text_value TEXT NOT NULL,
                    array_value INTEGER[] NOT NULL,
                    null_value TEXT
                )
                """.formatted(quotedSchema()));
            statement.execute(
                "INSERT INTO " + quotedSchema() +
                    ".parent_table(code, note) VALUES ('parent_a', NULL), ('parent_b', 'note')"
            );
            statement.execute("""
                INSERT INTO %s.child_table(parent_id, name, note)
                VALUES (1, 'alpha', NULL), (2, 'beta', 'present'), (1, 'excluded', 'filtered')
                """.formatted(quotedSchema()));
            statement.execute("INSERT INTO " + quotedSchema() + ".edit_rows(name, note) VALUES ('update_me', NULL), ('delete_me', 'old')");
            statement.execute(
                "COMMENT ON TABLE " + quotedSchema() + ".parent_table IS 'PostgreSQL full DDL table'"
            );
            statement.execute(
                "COMMENT ON COLUMN " + quotedSchema() + ".parent_table.note IS 'Optional parent note'"
            );
            statement.execute("GRANT SELECT ON TABLE " + quotedSchema() + ".parent_table TO PUBLIC");
            statement.execute("""
                INSERT INTO %s.type_values(
                    id, uuid_value, json_value, bytes_value, timestamp_value,
                    numeric_value, boolean_value, text_value, array_value, null_value
                ) VALUES (
                    1,
                    '123e4567-e89b-12d3-a456-426614174000',
                    '{"nested":{"enabled":true},"values":[1,2,3]}',
                    decode('00017fff', 'hex'),
                    TIMESTAMPTZ '2024-02-03 04:05:06+00',
                    12345678901234567890.1234567891,
                    TRUE,
                    'PostgreSQL text',
                    ARRAY[10,20,30],
                    NULL
                )
                """.formatted(quotedSchema()));
            connection.commit();
        }
    }

    @NotNull
    public String createSqlContext() throws Exception {
        Map<String, Object> context = client.sendQuery(
            GQL_SQL_CONTEXT_CREATE,
            Map.of(
                "projectId", getProjectId(),
                "connectionId", getConnectionId(),
                "defaultCatalog", config.database(),
                "defaultSchema", schemaName
            )
        );
        String contextId = JSONUtils.getString(context, "id");
        if (contextId == null) {
            throw new DBException("sqlContextCreate did not return a context id");
        }
        contextIds.add(contextId);
        resultIds.put(contextId, new LinkedHashSet<>());
        return contextId;
    }

    @NotNull
    public Map<String, Object> executeQuery(@NotNull String contextId, @NotNull String sql) throws Exception {
        return executeQuery(contextId, sql, Map.of());
    }

    @NotNull
    public Map<String, Object> executeQuery(
        @NotNull String contextId,
        @NotNull String sql,
        @NotNull Map<String, Object> filter
    ) throws Exception {
        Map<String, Object> variables = new HashMap<>();
        variables.put("projectId", getProjectId());
        variables.put("connectionId", getConnectionId());
        variables.put("contextId", contextId);
        variables.put("sql", sql);
        if (!filter.isEmpty()) {
            variables.put("filter", filter);
        }
        Map<String, Object> task = client.sendQuery(
            GraphQLTestConstant.GQL_ASYNC_SQL_EXECUTE,
            variables
        );
        String taskId = registerTask(task, "asyncSqlExecuteQuery");
        clientWrapper.waitTaskCompleted(taskId);
        return readTaskResultSet(contextId, taskId);
    }

    @NotNull
    public Map<String, Object> updateResults(
        @NotNull String contextId,
        @NotNull String resultsId,
        @NotNull List<Map<String, Object>> updatedRows,
        @NotNull List<Map<String, Object>> deletedRows,
        @NotNull List<Map<String, Object>> addedRows
    ) throws Exception {
        Map<String, Object> variables = new HashMap<>();
        variables.put("projectId", getProjectId());
        variables.put("connectionId", getConnectionId());
        variables.put("contextId", contextId);
        variables.put("resultsId", resultsId);
        variables.put("updatedRows", updatedRows);
        variables.put("deletedRows", deletedRows);
        variables.put("addedRows", addedRows);
        Map<String, Object> task = client.sendQuery(GQL_ASYNC_UPDATE_RESULTS, variables);
        String taskId = registerTask(task, "asyncUpdateResultsDataBatch");
        clientWrapper.waitTaskCompleted(taskId);
        return readTaskResultSet(contextId, taskId);
    }

    @NotNull
    public Map<String, Object> explainExecutionPlan(
        @NotNull String contextId,
        @NotNull String query,
        @NotNull Map<String, Object> configuration
    ) throws Exception {
        Map<String, Object> task = client.sendQuery(
            GraphQLTestConstant.GQL_ASYNC_SQL_EXPLAIN_EXECUTION_PLAN,
            Map.of(
                "projectId", getProjectId(),
                "connectionId", getConnectionId(),
                "contextId", contextId,
                "query", query,
                "configuration", configuration
            )
        );
        String taskId = registerTask(task, "asyncSqlExplainExecutionPlan");
        clientWrapper.waitTaskCompleted(taskId);
        Map<String, Object> plan = client.sendQuery(
            GraphQLTestConstant.GQL_ASYNC_SQL_EXPLAIN_EXECUTION_PLAN_RESULT,
            Map.of("taskId", taskId)
        );
        if (plan == null) {
            throw new DBException("asyncSqlExplainExecutionPlanResult did not return a plan");
        }
        return plan;
    }

    @NotNull
    public String generateEntityDdl(@NotNull String nodePath, boolean showFullDdl) throws Exception {
        Map<String, Object> task = client.sendQuery(
            GQL_ASYNC_GENERATE_ENTITY_QUERY,
            Map.of(
                "generatorId", "tableDDL",
                "nodePathList", List.of(nodePath),
                "generatorOptions", Map.of(
                    "useFullyQualifiedNames", true,
                    "compactSql", false,
                    "showFullDdl", showFullDdl
                )
            )
        );
        String taskId = registerTask(task, "asyncSqlGenerateEntityQuery");
        clientWrapper.waitTaskCompleted(taskId);
        Map<String, Object> taskInfo = client.sendQuery(
            GraphQLTestConstant.GQL_ASYNC_TASK_INFO,
            Map.of("id", taskId, "removeOnFinish", false)
        );
        if (taskInfo == null) {
            throw new DBException("asyncSqlGenerateEntityQuery task info is not available");
        }
        String ddl = JSONUtils.getString(taskInfo, "taskResult");
        if (ddl == null) {
            throw new DBException("asyncSqlGenerateEntityQuery did not return generated DDL");
        }
        return ddl;
    }

    @NotNull
    public List<Map<String, Object>> getNavigatorChildren(@NotNull String parentPath) throws Exception {
        List<Map<String, Object>> children = client.sendQuery(
            GQL_NAV_NODE_CHILDREN,
            Map.of("parentPath", parentPath)
        );
        return children == null ? List.of() : children;
    }

    @NotNull
    public List<Map<String, Object>> getResultAssociations(
        @NotNull String contextId,
        @NotNull String resultsId,
        boolean references
    ) throws Exception {
        List<Map<String, Object>> associations = client.sendQuery(
            GraphQLTestConstant.GQL_SQL_RESULT_ASSOCIATIONS,
            Map.of(
                "projectId", getProjectId(),
                "connectionId", getConnectionId(),
                "contextId", contextId,
                "resultsId", resultsId,
                "isReference", references
            )
        );
        return associations == null ? List.of() : associations;
    }

    @NotNull
    public Connection openJdbcConnection() throws SQLException {
        if (jdbcDriver == null || config == null) {
            throw new SQLException("PostgreSQL JDBC driver is not initialized");
        }
        Properties properties = new Properties();
        properties.setProperty("user", config.user());
        properties.setProperty("password", config.password());
        Connection connection = jdbcDriver.connect(config.jdbcUrl(), properties);
        if (connection == null) {
            throw new SQLException("PostgreSQL JDBC driver rejected the test URL");
        }
        return connection;
    }

    @NotNull
    public String getSchemaName() {
        return schemaName;
    }

    @NotNull
    public String getProjectId() {
        return globalProject.getId();
    }

    @NotNull
    public String getConnectionId() {
        return dataSourceContainer.getId();
    }

    @NotNull
    public String getConnectionNodePath() {
        return webConnectionInfo.getNodePath();
    }

    @NotNull
    public PostgreSQLConnectionConfig getConfig() {
        return config;
    }

    @NotNull
    private Map<String, Object> readTaskResultSet(@NotNull String contextId, @NotNull String taskId) throws Exception {
        Map<String, Object> resultSet = clientWrapper.readTaskResultSet(taskId);
        String resultId = JSONUtils.getString(resultSet, "id");
        if (resultId == null) {
            throw new DBException("SQL task did not return a result set id");
        }
        resultIds.computeIfAbsent(contextId, key -> new LinkedHashSet<>()).add(resultId);
        return resultSet;
    }

    @NotNull
    private String registerTask(@NotNull Map<String, Object> task, @NotNull String operation) throws DBException {
        String taskId = JSONUtils.getString(task, "id");
        if (taskId == null) {
            throw new DBException(operation + " did not return a task id");
        }
        taskIds.add(taskId);
        return taskId;
    }

    @NotNull
    private String quotedSchema() {
        return '"' + schemaName + '"';
    }

    @Override
    public void close() throws Exception {
        List<Exception> failures = new ArrayList<>();
        closeGraphQLResources(failures);
        closeDataSourceResources(failures);
        dropSchema(failures);
        closeOwnedSession(failures);

        if (!failures.isEmpty()) {
            Exception failure = new Exception("Failed to clean up PostgreSQL datasource test fixture");
            failures.forEach(failure::addSuppressed);
            throw failure;
        }
    }

    private void closeDataSourceResources(@NotNull List<Exception> failures) {
        if (globalProject != null && dataSourceContainer != null) {
            try {
                globalProject.removeConnection(dataSourceContainer);
            } catch (Exception e) {
                failures.add(e);
            }
            try {
                dataSourceContainer.disconnect(monitor);
            } catch (Exception e) {
                failures.add(e);
            }
            try {
                globalProject.getDataSourceRegistry().removeDataSource(dataSourceContainer);
            } catch (Exception e) {
                failures.add(e);
            }
        }
    }

    private void dropSchema(@NotNull List<Exception> failures) {
        if (jdbcDriver != null && config != null && schemaName != null) {
            try (Connection connection = openJdbcConnection(); Statement statement = connection.createStatement()) {
                connection.setAutoCommit(false);
                statement.execute("DROP SCHEMA IF EXISTS " + quotedSchema() + " CASCADE");
                connection.commit();
            } catch (Exception e) {
                failures.add(e);
            }
        }
    }

    private void closeOwnedSession(@NotNull List<Exception> failures) {
        if (ownsSession && sessionId != null) {
            try {
                WebAppUtils.getWebApplication().getSessionManager().closeSession(sessionId);
            } catch (Exception e) {
                failures.add(e);
            }
        }
    }

    private void closeGraphQLResources(@NotNull List<Exception> failures) {
        if (globalProject == null || dataSourceContainer == null) {
            return;
        }
        for (Map.Entry<String, Set<String>> entry : resultIds.entrySet()) {
            for (String resultId : entry.getValue()) {
                try {
                    client.sendQuery(
                        GQL_SQL_RESULT_CLOSE,
                        Map.of(
                            "projectId", getProjectId(),
                            "connectionId", getConnectionId(),
                            "contextId", entry.getKey(),
                            "resultId", resultId
                        )
                    );
                } catch (Exception e) {
                    failures.add(e);
                }
            }
        }
        for (String contextId : contextIds) {
            try {
                client.sendQuery(
                    GQL_SQL_CONTEXT_DESTROY,
                    Map.of(
                        "projectId", getProjectId(),
                        "connectionId", getConnectionId(),
                        "contextId", contextId
                    )
                );
            } catch (Exception e) {
                failures.add(e);
            }
        }
        for (String taskId : taskIds) {
            try {
                client.sendQuery(
                    GraphQLTestConstant.GQL_ASYNC_TASK_INFO,
                    Map.of("id", taskId, "removeOnFinish", true)
                );
            } catch (Exception e) {
                // Finished tasks may already have been evicted.
            }
        }
    }

    @NotNull
    private static WebSession resolveWebSession(@NotNull String sessionId) throws DBException {
        BaseWebSession session = WebAppUtils.getWebApplication().getSessionManager().getSession(sessionId);
        if (session instanceof WebSession webSession) {
            return webSession;
        }
        throw new DBException("Web session not found: " + sessionId);
    }

    public record PostgreSQLConnectionConfig(
        @NotNull String host,
        @NotNull String port,
        @NotNull String database,
        @NotNull String user,
        @NotNull String password
    ) {
        @NotNull
        public static PostgreSQLConnectionConfig fromEnvironment() throws DBException {
            String port = environmentOrDefault(ENV_PORT, DEFAULT_PORT);
            try {
                int portNumber = Integer.parseInt(port);
                if (portNumber < 1 || portNumber > 65535) {
                    throw new NumberFormatException();
                }
            } catch (NumberFormatException e) {
                throw new DBException(ENV_PORT + " must be a valid TCP port");
            }
            return new PostgreSQLConnectionConfig(
                environmentOrDefault(ENV_HOST, DEFAULT_HOST),
                port,
                environmentOrDefault(ENV_DATABASE, DEFAULT_DATABASE),
                environmentOrDefault(ENV_USER, DEFAULT_USER),
                environmentOrDefault(ENV_PASSWORD, DEFAULT_PASSWORD)
            );
        }

        @NotNull
        private static String environmentOrDefault(@NotNull String name, @NotNull String defaultValue) {
            String value = System.getenv(name);
            return value == null || value.isBlank() ? defaultValue : value;
        }

        @NotNull
        public String jdbcUrl() {
            String urlHost = host.indexOf(':') >= 0 && !host.startsWith("[") ? '[' + host + ']' : host;
            return "jdbc:postgresql://" + urlHost + ':' + port + '/' + database;
        }

        @NotNull
        public String schemaJdbcUrl(@NotNull String schema) {
            return jdbcUrl() + "?currentSchema=" + schema;
        }
    }
}

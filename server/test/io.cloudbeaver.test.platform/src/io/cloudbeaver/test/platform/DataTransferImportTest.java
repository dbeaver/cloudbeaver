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
package io.cloudbeaver.test.platform;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.WebSessionProjectImpl;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import io.cloudbeaver.test.WebGQLClient;
import io.cloudbeaver.test.platform.util.GraphQLTestClientWrapper;
import io.cloudbeaver.test.platform.util.WebDBTestUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCSession;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCStatement;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNProject;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.DBSObjectContainer;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.HttpConstants;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class DataTransferImportTest extends CloudbeaverMockTest {

    private static final String TABLE_NAME = "DATA_TRANSFER_IMPORT_TEST";
    private static final String HEADER_NONE_TABLE_NAME = "DATA_TRANSFER_HEADER_NONE";
    private static final String CSV_RESOURCE_PATH = "data-transfer-import/";
    private static final String CSV_PROCESSOR_ID = "stream_producer:stream.csv";
    private static final String XML_PROCESSOR_ID = "stream_producer:stream.xml";
    private static final String XLSX_PROCESSOR_ID = "stream_producer:stream.xlsx";
    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();
    private static final String GQL_IMPORT_PROCESSORS = """
        query {
          result: dataTransferAvailableImportStreamProcessors {
            id
            properties {
              required
              id
              displayName
              description
              category
              dataType
              defaultValue
              validValues
              length
              features
              order
            }
          }
        }""";
    private static final String GQL_IMPORT_DATA_WITH_NULL_PROCESSOR_PROPERTIES = """
        query importDataWithNullProcessorProperties(
          $projectId: ID
          $connectionId: ID!
          $contextId: ID!
          $resultsId: ID!
        ) {
          result: dataTransferImportDataIntoResults(
            projectId: $projectId
            connectionId: $connectionId
            contextId: $contextId
            resultsId: $resultsId
            parameters: {
              processorId: "%s"
              processorProperties: null
            }
          ) {
            id
          }
        }""".formatted(CSV_PROCESSOR_ID);
    private static final String GQL_IMPORT_DATA = """
        query importData(
          $projectId: ID
          $connectionId: ID!
          $contextId: ID!
          $resultsId: ID!
          $parameters: DataTransferImportParameters!
        ) {
          result: dataTransferImportDataIntoResults(
            projectId: $projectId
            connectionId: $connectionId
            contextId: $contextId
            resultsId: $resultsId
            parameters: $parameters
          ) {
            id
          }
        }""";
    private static final String GQL_READ_DATA = """
        mutation readData(
          $projectId: ID
          $connectionId: ID!
          $contextId: ID!
          $containerNodePath: ID!
          $filter: SQLDataFilter
        ) {
          result: asyncReadDataFromContainer(
            projectId: $projectId
            connectionId: $connectionId
            contextId: $contextId
            containerNodePath: $containerNodePath
            filter: $filter
          ) {
            id
          }
        }""";

    private final WebGQLClient client = CEAppStarter.createClient();
    private final GraphQLTestClientWrapper clientWrapper = new GraphQLTestClientWrapper(client);
    private final DBRProgressMonitor monitor = new LoggingProgressMonitor();
    private DBPDataSourceContainer databaseContainer;
    private JDBCSession databaseSession;
    private WebSessionProjectImpl project;
    private WebConnectionInfo webConnectionInfo;
    private WebSQLContextInfo sqlContext;
    private String resultsId;
    private List<Map<String, Object>> importProcessors;
    private Map<String, Object> csvProcessor;

    @BeforeEach
    public void prepareImportTarget() throws Exception {
        CEAppStarter.authenticateTestUser(client);
        WebSession webSession = resolveWebSession();
        project = webSession.getSingletonProject();
        Assertions.assertNotNull(project, "Active project not found");
        databaseContainer = WebDBTestUtils.createH2DataSource(monitor, project);
        project.getDataSourceRegistry().addDataSource(databaseContainer);
        databaseSession = DBUtils.openUtilSession(monitor, databaseContainer, "Internal database session");
        databaseSession.enableLogging(false);
        webConnectionInfo = project.addConnection(databaseContainer);
        try (JDBCStatement statement = databaseSession.createStatement()) {
            Assertions.assertFalse(statement.execute(
                "CREATE TABLE " + TABLE_NAME +
                    " (ID INTEGER NOT NULL, TEXT_VALUE VARCHAR(100), TS_VALUE TIMESTAMP)"
            ));
            Assertions.assertFalse(statement.execute(
                "CREATE TABLE " + HEADER_NONE_TABLE_NAME + " (Column1 INTEGER NOT NULL, Column2 VARCHAR(100))"
            ));
        }

        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        sqlContext = sqlProcessor.createContext(null, "PUBLIC", project.getId());
        resultsId = openImportTarget(webSession, TABLE_NAME);
        importProcessors = getImportProcessors();
        csvProcessor = findProcessor(importProcessors, CSV_PROCESSOR_ID);
    }

    @NotNull
    private String openImportTarget(@NotNull WebSession webSession, @NotNull String tableName) throws Exception {
        Map<String, Object> readTask = client.sendQuery(
            GQL_READ_DATA,
            Map.of(
                "projectId", project.getId(),
                "connectionId", databaseContainer.getId(),
                "contextId", sqlContext.getId(),
                "containerNodePath", resolveNodePath(webSession, tableName),
                "filter", Map.of("limit", 200, "offset", 0)
            )
        );
        String taskId = readTask.get("id").toString();
        clientWrapper.waitTaskCompleted(taskId);
        return clientWrapper.readTaskResultSet(taskId).get("id").toString();
    }

    @AfterEach
    public void releaseImportTarget() throws Exception {
        try {
            if (sqlContext != null && webConnectionInfo != null) {
                WebServiceBindingSQL.getSQLProcessor(webConnectionInfo).destroyContext(sqlContext);
            }
        } finally {
            try {
                if (databaseSession != null) {
                    databaseSession.close();
                }
            } finally {
                try {
                    if (project != null && databaseContainer != null) {
                        project.removeConnection(databaseContainer);
                    }
                } finally {
                    if (project != null && databaseContainer != null) {
                        project.getDataSourceRegistry().removeDataSource(databaseContainer);
                    }
                }
            }
        }
    }

    @Test
    public void shouldExposeImportProcessorPropertyMetadata() {
        List<Map<String, Object>> properties = JSONUtils.getObjectList(csvProcessor, "properties");
        Map<String, Object> delimiter = findProperty(properties, "delimiter");
        Assertions.assertEquals("String", delimiter.get("dataType"));
        Assertions.assertEquals(",", delimiter.get("defaultValue"));
        Assertions.assertEquals(true, delimiter.get("required"));

        Map<String, Object> header = findProperty(properties, "header");
        Assertions.assertEquals("top", header.get("defaultValue"));
        Assertions.assertTrue(((List<?>) header.get("validValues")).containsAll(List.of("none", "top")));

        Map<String, Object> strictQuotes = findProperty(properties, "strictQuotes");
        Assertions.assertEquals("Boolean", strictQuotes.get("dataType"));
        Assertions.assertEquals(false, strictQuotes.get("defaultValue"));

        Map<String, Object> samplesCount = findProperty(properties, "columnTypeSamplesCount");
        Assertions.assertEquals("Integer", samplesCount.get("dataType"));
        Assertions.assertEquals(100, ((Number) samplesCount.get("defaultValue")).intValue());

        Map<String, Object> nullString = findProperty(properties, "nullString");
        Assertions.assertTrue(nullString.containsKey("defaultValue"));
        Assertions.assertNull(nullString.get("defaultValue"));

        for (Map<String, Object> property : properties) {
            for (String field : List.of(
                "required", "id", "displayName", "description", "category", "dataType", "defaultValue",
                "validValues", "length", "features", "order"
            )) {
                Assertions.assertTrue(
                    property.containsKey(field),
                    "Missing " + property.get("id") + " property metadata field: " + field
                );
            }
        }
    }

    @Test
    public void shouldExposeOnlyCeImportProcessors() {
        List<String> processorIds = importProcessors.stream().map(processor -> processor.get("id").toString()).toList();

        Assertions.assertTrue(processorIds.contains(CSV_PROCESSOR_ID));
        Assertions.assertFalse(processorIds.contains(XML_PROCESSOR_ID));
        Assertions.assertFalse(processorIds.contains(XLSX_PROCESSOR_ID));
    }

    @Test
    public void shouldImportWithLegacyProcessorDefaults() throws Exception {
        importCsvResource("01-legacy-defaults.csv", Map.of("processorId", csvProcessor.get("id")));

        assertRowCount(1);
        assertImportedValue(1, "legacy");
    }

    @Test
    public void shouldImportWithExplicitNullProcessorProperties() throws Exception {
        String taskId = createImportTask(GQL_IMPORT_DATA_WITH_NULL_PROCESSOR_PROPERTIES, null);
        uploadCsv(taskId, "ID,TEXT_VALUE\n1,default\n");
        clientWrapper.waitTaskCompleted(taskId);

        assertRowCount(1);
        assertImportedValue(1, "default");
    }

    @Test
    public void shouldImportWithEmptyProcessorProperties() throws Exception {
        importCsv(
            "ID,TEXT_VALUE\n1,default\n",
            Map.of("processorId", csvProcessor.get("id"), "processorProperties", Map.of())
        );

        assertRowCount(1);
        assertImportedValue(1, "default");
    }

    @Test
    public void shouldPreserveFalsyValuesAndIgnoreUnknownProperties() throws Exception {
        Map<String, Object> processorProperties = new HashMap<>();
        processorProperties.put("delimiter", null);
        processorProperties.put("emptyStringNull", false);
        processorProperties.put("strictQuotes", false);
        processorProperties.put("columnTypeSamplesCount", 0);
        processorProperties.put("nullString", "");
        processorProperties.put("unknownProperty", "unexpected");

        importCsv(
            "ID,TEXT_VALUE\n4,\n",
            Map.of("processorId", csvProcessor.get("id"), "processorProperties", processorProperties)
        );

        assertRowCount(1);
        assertImportedValue(4, "");
    }

    @Test
    public void shouldUseOverridesForDiscoveryAndTransfer() throws Exception {
        importCsvResource(
            "02-semicolon-empty.csv",
            Map.of(
                "processorId", csvProcessor.get("id"),
                "processorProperties", Map.of("delimiter", ";", "emptyStringNull", true)
            )
        );

        assertRowCount(2);
        assertImportedValue(2, "semicolon");
        assertImportedValue(3, null);
    }

    @Test
    public void shouldImportEmptyNullMatrixWithEmptyStringsPreserved() throws Exception {
        importCsvResource(
            "03-empty-null-matrix.csv",
            Map.of(
                "processorId", csvProcessor.get("id"),
                "processorProperties", Map.of(
                    "emptyStringNull", false,
                    "nullString", "NULL",
                    "trimWhitespaces", true
                )
            )
        );

        assertRowCount(6);
        assertImportedValue(10, "");
        assertImportedValue(11, "");
        assertImportedValue(12, null);
        assertImportedValue(13, null);
        assertImportedValue(14, null);
        assertImportedValue(15, "value");
    }

    @Test
    public void shouldImportEmptyNullMatrixWithEmptyStringsAsNulls() throws Exception {
        importCsvResource(
            "03-empty-null-matrix.csv",
            Map.of(
                "processorId", csvProcessor.get("id"),
                "processorProperties", Map.of(
                    "emptyStringNull", true,
                    "nullString", "NULL",
                    "trimWhitespaces", true
                )
            )
        );

        assertRowCount(6);
        for (int id = 10; id <= 14; id++) {
            assertImportedValue(id, null);
        }
        assertImportedValue(15, "value");
    }

    @Test
    public void shouldImportCustomTimestamps() throws Exception {
        importCsvResource(
            "04-custom-timestamp.csv",
            Map.of(
                "processorId", csvProcessor.get("id"),
                "processorProperties", Map.of("delimiter", ";", "timestampFormat", "dd.MM.yyyy HH:mm:ss")
            )
        );

        assertRowCount(2);
        assertImportedTimestamp(30, LocalDateTime.of(2025, 12, 31, 23, 59, 58));
        assertImportedTimestamp(31, LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    @Test
    public void shouldImportWithCustomQuote() throws Exception {
        importCsvResource(
            "05-custom-quote.csv",
            Map.of(
                "processorId", csvProcessor.get("id"),
                "processorProperties", Map.of("delimiter", ";", "quoteChar", "'", "trimWhitespaces", false)
            )
        );

        assertRowCount(3);
        assertImportedValue(40, "text;with;delimiter");
        assertImportedValue(41, " leading and trailing ");
        assertImportedValue(42, "plain");
    }

    @Test
    public void shouldImportWithoutHeader() throws Exception {
        WebSession webSession = resolveWebSession();
        resultsId = openImportTarget(webSession, HEADER_NONE_TABLE_NAME);
        importCsvResource(
            "06-header-none.csv",
            Map.of(
                "processorId", csvProcessor.get("id"),
                "processorProperties", Map.of("header", "none")
            ),
            HEADER_NONE_TABLE_NAME
        );

        assertRowCount(HEADER_NONE_TABLE_NAME, 2);
        assertImportedValue(HEADER_NONE_TABLE_NAME, "Column1", "Column2", 60, "no-header-first-row");
        assertImportedValue(HEADER_NONE_TABLE_NAME, "Column1", "Column2", 61, "no-header-second-row");
    }

    @Test
    public void shouldImportUtf8Text() throws Exception {
        importCsvResource(
            "07-utf8-text.csv",
            Map.of(
                "processorId", csvProcessor.get("id"),
                "processorProperties", Map.of("encoding", "utf-8")
            )
        );

        assertRowCount(5);
        assertImportedValue(50, "Привет");
        assertImportedValue(51, "幸");
        assertImportedValue(52, "Ä");
        assertImportedValue(53, "مرحبا");
        assertImportedValue(54, "Добрый день");
    }

    @Test
    public void shouldReportInvalidProcessorPropertyValue() throws Exception {
        String taskId = createImportTask(
            GQL_IMPORT_DATA,
            Map.of(
                "processorId", csvProcessor.get("id"),
                "processorProperties", Map.of("encoding", "definitely-not-a-charset")
            )
        );
        uploadCsv(taskId, "ID,TEXT_VALUE\n1,value\n");

        Map<String, Object> taskInfo = clientWrapper.waitTaskFinished(taskId);
        Object error = taskInfo.get("error");
        Assertions.assertTrue(error instanceof Map<?, ?>, "Async task error not found: " + taskInfo);
        Object message = ((Map<?, ?>) error).get("message");
        Assertions.assertTrue(message instanceof String && !((String) message).isBlank(), "Empty async task error");

        assertRowCount(0);
    }

    private void importCsv(@NotNull String contents, @NotNull Map<String, Object> parameters) throws Exception {
        assertRowCount(0);
        String taskId = createImportTask(GQL_IMPORT_DATA, parameters);
        uploadCsv(taskId, contents);
        clientWrapper.waitTaskCompleted(taskId);
    }

    private void importCsvResource(
        @NotNull String resourceName,
        @NotNull Map<String, Object> parameters
    ) throws Exception {
        importCsvResource(resourceName, parameters, TABLE_NAME);
    }

    private void importCsvResource(
        @NotNull String resourceName,
        @NotNull Map<String, Object> parameters,
        @NotNull String tableName
    ) throws Exception {
        assertRowCount(tableName, 0);
        String taskId = createImportTask(GQL_IMPORT_DATA, parameters);
        uploadCsv(taskId, resourceName, readCsvResource(resourceName));
        clientWrapper.waitTaskCompleted(taskId);
    }

    @NotNull
    private String createImportTask(
        @NotNull String query,
        @Nullable Map<String, Object> parameters
    ) throws Exception {
        Map<String, Object> variables = new HashMap<>();
        variables.put("projectId", project.getId());
        variables.put("connectionId", databaseContainer.getId());
        variables.put("contextId", sqlContext.getId());
        variables.put("resultsId", resultsId);
        if (parameters != null) {
            variables.put("parameters", parameters);
        }
        Map<String, Object> task = client.sendQuery(query, variables);
        return task.get("id").toString();
    }

    private void uploadCsv(@NotNull String taskId, @NotNull String contents) throws Exception {
        uploadCsv(taskId, "import.csv", contents.getBytes(StandardCharsets.UTF_8));
    }

    private void uploadCsv(
        @NotNull String taskId,
        @NotNull String fileName,
        @NotNull byte[] contents
    ) throws Exception {
        String boundary = "----CloudBeaverTest" + UUID.randomUUID();
        byte[] prefix = ("--" + boundary + "\r\n" +
            "Content-Disposition: form-data; name=\"variables\"\r\n\r\n" +
            "{\"taskId\":\"" + taskId + "\"}\r\n" +
            "--" + boundary + "\r\n" +
            "Content-Disposition: form-data; name=\"fileData\"; filename=\"" + fileName + "\"\r\n" +
            "Content-Type: text/csv\r\n\r\n").getBytes(StandardCharsets.UTF_8);
        byte[] suffix = ("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(CEAppStarter.SERVER_URL + "/api/data/import"))
            .timeout(Duration.ofSeconds(30))
            .header(HttpConstants.HEADER_CONTENT_TYPE, "multipart/form-data; boundary=" + boundary)
            .header("TE-Client-Version", GeneralUtils.getMajorVersion())
            .header("Cookie", CBConstants.CB_SESSION_COOKIE_NAME + "=" + client.getSessionIdCookie())
            .POST(HttpRequest.BodyPublishers.ofByteArrays(List.of(prefix, contents, suffix)))
            .build();

        HttpResponse<String> response = HTTP_CLIENT.send(
            request,
            HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );
        Assertions.assertEquals(200, response.statusCode(), response.body());
    }

    @NotNull
    private byte[] readCsvResource(@NotNull String resourceName) throws Exception {
        InputStream resource = DataTransferImportTest.class.getResourceAsStream(CSV_RESOURCE_PATH + resourceName);
        Assertions.assertNotNull(resource, "CSV test resource not found: " + resourceName);
        try (resource) {
            return resource.readAllBytes();
        }
    }

    private void assertImportedValue(int id, @Nullable String expectedValue) throws Exception {
        assertImportedValue(TABLE_NAME, "ID", "TEXT_VALUE", id, expectedValue);
    }

    private void assertImportedValue(
        @NotNull String tableName,
        @NotNull String idColumn,
        @NotNull String valueColumn,
        int id,
        @Nullable String expectedValue
    ) throws Exception {
        try (
            JDBCStatement statement = databaseSession.createStatement();
            ResultSet resultSet = statement.executeQuery(
                "SELECT " + valueColumn + " FROM " + tableName + " WHERE " + idColumn + " = " + id
            )
        ) {
            Assertions.assertTrue(resultSet.next(), "Imported row not found: " + id);
            String actualValue = resultSet.getString(1);
            if (expectedValue == null) {
                Assertions.assertTrue(resultSet.wasNull(), "Expected SQL NULL for row: " + id);
            } else {
                Assertions.assertFalse(resultSet.wasNull(), "Unexpected SQL NULL for row: " + id);
            }
            Assertions.assertEquals(expectedValue, actualValue);
            Assertions.assertFalse(resultSet.next());
        }
    }

    private void assertImportedTimestamp(int id, @NotNull LocalDateTime expectedValue) throws Exception {
        try (
            JDBCStatement statement = databaseSession.createStatement();
            ResultSet resultSet = statement.executeQuery("SELECT TS_VALUE FROM " + TABLE_NAME + " WHERE ID = " + id)
        ) {
            Assertions.assertTrue(resultSet.next(), "Imported row not found: " + id);
            Timestamp actualValue = resultSet.getTimestamp(1);
            Assertions.assertFalse(resultSet.wasNull(), "Unexpected SQL NULL for row: " + id);
            Assertions.assertEquals(expectedValue, actualValue.toLocalDateTime());
            Assertions.assertFalse(resultSet.next());
        }
    }

    private void assertRowCount(int expectedCount) throws Exception {
        assertRowCount(TABLE_NAME, expectedCount);
    }

    private void assertRowCount(@NotNull String tableName, int expectedCount) throws Exception {
        try (
            JDBCStatement statement = databaseSession.createStatement();
            ResultSet resultSet = statement.executeQuery("SELECT COUNT(*) FROM " + tableName)
        ) {
            Assertions.assertTrue(resultSet.next());
            Assertions.assertEquals(expectedCount, resultSet.getInt(1));
            Assertions.assertFalse(resultSet.next());
        }
    }

    @NotNull
    private List<Map<String, Object>> getImportProcessors() throws Exception {
        return client.sendQuery(GQL_IMPORT_PROCESSORS, null);
    }

    @NotNull
    private Map<String, Object> findProcessor(
        @NotNull List<Map<String, Object>> processors,
        @NotNull String processorId
    ) {
        return processors.stream()
            .filter(processor -> processorId.equals(processor.get("id")))
            .findFirst()
            .orElseThrow(() -> new AssertionError("Import processor not found: " + processorId));
    }

    @NotNull
    private Map<String, Object> findProperty(
        @NotNull List<Map<String, Object>> properties,
        @NotNull String propertyId
    ) {
        return properties.stream()
            .filter(property -> propertyId.equals(property.get("id")))
            .findFirst()
            .orElseThrow(() -> new AssertionError("Processor property not found: " + propertyId));
    }

    @NotNull
    private String resolveNodePath(@NotNull WebSession session, @NotNull String tableName) throws Exception {
        DBRProgressMonitor progressMonitor = session.getProgressMonitor();
        DBNModel navigatorModel = session.getNavigatorModelOrThrow();
        DBNProject projectNode = navigatorModel.getRoot().getProjectNode(project);
        Assertions.assertNotNull(projectNode, "Project navigator node not found");
        projectNode.getDatabases().getChildren(progressMonitor);

        DBSObjectContainer rootContainer = DBUtils.getAdapter(DBSObjectContainer.class, webConnectionInfo.getDataSource());
        Assertions.assertNotNull(rootContainer, "Connection is not a database object container");
        DBSEntity table = findEntity(progressMonitor, rootContainer, tableName, 4);
        Assertions.assertNotNull(table, tableName + " entity not found");

        DBNDatabaseNode tableNode = navigatorModel.getNodeByObject(progressMonitor, table, true);
        Assertions.assertNotNull(tableNode, "Navigator node for " + tableName + " not found");
        return tableNode.getNodeUri();
    }

    @NotNull
    private WebSession resolveWebSession() throws DBException {
        BaseWebSession session = WebAppUtils.getWebApplication().getSessionManager()
            .getSession(client.getSessionIdCookie());
        if (session instanceof WebSession ws) {
            return ws;
        }
        throw new DBException("Authenticated web session not found");
    }

    @Nullable
    private DBSEntity findEntity(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBSObjectContainer container,
        @NotNull String name,
        int depth
    ) throws DBException {
        DBSObject direct = container.getChild(monitor, name);
        if (direct instanceof DBSEntity entity) {
            return entity;
        }
        if (depth <= 0) {
            return null;
        }
        Collection<? extends DBSObject> children = container.getChildren(monitor);
        if (children == null) {
            return null;
        }
        for (DBSObject child : children) {
            if (child instanceof DBSObjectContainer subContainer) {
                DBSEntity entity = findEntity(monitor, subContainer, name, depth - 1);
                if (entity != null) {
                    return entity;
                }
            }
        }
        return null;
    }
}

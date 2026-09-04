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
import org.eclipse.core.runtime.Platform;
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
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferProcessorDescriptor;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferRegistry;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.HttpConstants;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.sql.ResultSet;
import java.time.Duration;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class DataTransferImportTest extends CloudbeaverMockTest {

    private static final String TABLE_NAME = "DATA_TRANSFER_IMPORT_TEST";
    private static final String CSV_PROCESSOR_ID = "stream_producer:stream.csv";
    private static final String XML_PROCESSOR_ID = "stream_producer:stream.xml";
    private static final String XLSX_PROCESSOR_ID = "stream_producer:stream.xlsx";
    private static final String DATA_TRANSFER_BUNDLE_ID = "io.cloudbeaver.service.data.transfer";
    private static final String DATA_TRANSFER_UTILS_CLASS =
        "io.cloudbeaver.service.data.transfer.impl.WebDataTransferUtils";
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
    private WebSession webSession;
    private WebSQLContextInfo sqlContext;
    private String resultsId;
    private List<Map<String, Object>> importProcessors;
    private Map<String, Object> csvProcessor;

    @BeforeEach
    public void prepareImportTarget() throws Exception {
        CEAppStarter.authenticateTestUser(client);
        webSession = resolveWebSession();
        project = webSession.getSingletonProject();
        Assertions.assertNotNull(project, "Active project not found");
        databaseContainer = WebDBTestUtils.createH2DataSource(monitor, project);
        project.getDataSourceRegistry().addDataSource(databaseContainer);
        databaseSession = DBUtils.openUtilSession(monitor, databaseContainer, "Internal database session");
        databaseSession.enableLogging(false);
        webConnectionInfo = project.addConnection(databaseContainer);
        try (JDBCStatement statement = databaseSession.createStatement()) {
            Assertions.assertFalse(statement.execute(
                "CREATE TABLE " + TABLE_NAME + " (ID INTEGER NOT NULL, TEXT_VALUE VARCHAR(100))"
            ));
        }

        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        sqlContext = sqlProcessor.createContext(null, "PUBLIC", project.getId());
        Map<String, Object> readTask = client.sendQuery(
            GQL_READ_DATA,
            Map.of(
                "projectId", project.getId(),
                "connectionId", databaseContainer.getId(),
                "contextId", sqlContext.getId(),
                "containerNodePath", resolveNodePath(webSession),
                "filter", Map.of("limit", 200, "offset", 0)
            )
        );
        String taskId = readTask.get("id").toString();
        clientWrapper.waitTaskCompleted(taskId);
        resultsId = clientWrapper.readTaskResultSet(taskId).get("id").toString();
        importProcessors = getImportProcessors();
        csvProcessor = findProcessor(importProcessors, CSV_PROCESSOR_ID);
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
    public void shouldBuildDescriptorDefaultsForMissingProperties() throws Exception {
        DataTransferProcessorDescriptor descriptor = getCsvProcessorDescriptor();
        Map<String, Object> nullDefaults = makeProcessorProperties(descriptor, null);

        Assertions.assertEquals(descriptor.getProperties().length, nullDefaults.size());
        for (var property : descriptor.getProperties()) {
            Assertions.assertTrue(nullDefaults.containsKey(property.getId()));
            Assertions.assertEquals(property.getDefaultValue(), nullDefaults.get(property.getId()));
        }
        Assertions.assertEquals(",", nullDefaults.get("delimiter"));
        Assertions.assertEquals("top", nullDefaults.get("header"));
        Assertions.assertEquals(false, nullDefaults.get("strictQuotes"));
        Assertions.assertEquals(100, nullDefaults.get("columnTypeSamplesCount"));
        Assertions.assertTrue(nullDefaults.containsKey("nullString"));
        Assertions.assertNull(nullDefaults.get("nullString"));
        Assertions.assertEquals(nullDefaults, makeProcessorProperties(descriptor, Map.of()));
    }

    @Test
    public void shouldApplyPartialProcessorPropertyOverride() throws Exception {
        DataTransferProcessorDescriptor descriptor = getCsvProcessorDescriptor();
        Map<String, Object> expected = new HashMap<>(makeProcessorProperties(descriptor, null));
        expected.put("delimiter", ";");

        Assertions.assertEquals(expected, makeProcessorProperties(descriptor, Map.of("delimiter", ";")));
    }

    @Test
    public void shouldPreserveFalsyValuesAndIgnoreUnknownProperties() throws Exception {
        DataTransferProcessorDescriptor descriptor = getCsvProcessorDescriptor();
        Map<String, Object> overrides = new HashMap<>();
        overrides.put("delimiter", null);
        overrides.put("emptyStringNull", false);
        overrides.put("columnTypeSamplesCount", 0);
        overrides.put("nullString", "");
        overrides.put("unknownProperty", "unexpected");

        Map<String, Object> effectiveProperties = makeProcessorProperties(descriptor, overrides);
        Assertions.assertEquals(",", effectiveProperties.get("delimiter"));
        Assertions.assertEquals(false, effectiveProperties.get("emptyStringNull"));
        Assertions.assertEquals(0, effectiveProperties.get("columnTypeSamplesCount"));
        Assertions.assertEquals("", effectiveProperties.get("nullString"));
        Assertions.assertFalse(effectiveProperties.containsKey("unknownProperty"));
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
        importCsv("ID,TEXT_VALUE\n1,legacy\n", Map.of("processorId", csvProcessor.get("id")));

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
    public void shouldUseOverridesForDiscoveryAndTransfer() throws Exception {
        importCsv(
            "ID;TEXT_VALUE\n2;semicolon\n3;\n",
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
        String taskId = createImportTask(GQL_IMPORT_DATA, parameters);
        uploadCsv(taskId, contents);
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
        String boundary = "----CloudBeaverTest" + UUID.randomUUID();
        String body = "--" + boundary + "\r\n" +
            "Content-Disposition: form-data; name=\"variables\"\r\n\r\n" +
            "{\"taskId\":\"" + taskId + "\"}\r\n" +
            "--" + boundary + "\r\n" +
            "Content-Disposition: form-data; name=\"fileData\"; filename=\"import.csv\"\r\n" +
            "Content-Type: text/csv\r\n\r\n" +
            contents + "\r\n" +
            "--" + boundary + "--\r\n";
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(CEAppStarter.SERVER_URL + "/api/data/import"))
            .timeout(Duration.ofSeconds(30))
            .header(HttpConstants.HEADER_CONTENT_TYPE, "multipart/form-data; boundary=" + boundary)
            .header("TE-Client-Version", GeneralUtils.getMajorVersion())
            .header("Cookie", CBConstants.CB_SESSION_COOKIE_NAME + "=" + client.getSessionIdCookie())
            .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
            .build();

        HttpResponse<String> response = HTTP_CLIENT.send(
            request,
            HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );
        Assertions.assertEquals(200, response.statusCode(), response.body());
    }

    private void assertImportedValue(int id, @Nullable String expectedValue) throws Exception {
        try (
            JDBCStatement statement = databaseSession.createStatement();
            ResultSet resultSet = statement.executeQuery("SELECT TEXT_VALUE FROM " + TABLE_NAME + " WHERE ID = " + id)
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

    private void assertRowCount(int expectedCount) throws Exception {
        try (
            JDBCStatement statement = databaseSession.createStatement();
            ResultSet resultSet = statement.executeQuery("SELECT COUNT(*) FROM " + TABLE_NAME)
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
    private DataTransferProcessorDescriptor getCsvProcessorDescriptor() {
        DataTransferProcessorDescriptor descriptor = DataTransferRegistry.getInstance().getProcessor(CSV_PROCESSOR_ID);
        Assertions.assertNotNull(descriptor, "CSV import processor descriptor not found");
        return descriptor;
    }

    @NotNull
    @SuppressWarnings("unchecked")
    private Map<String, Object> makeProcessorProperties(
        @NotNull DataTransferProcessorDescriptor descriptor,
        @Nullable Map<String, Object> processorProperties
    ) throws Exception {
        var bundle = Platform.getBundle(DATA_TRANSFER_BUNDLE_ID);
        Assertions.assertNotNull(bundle, "Data transfer service bundle not found");
        Class<?> utilsClass = bundle.loadClass(DATA_TRANSFER_UTILS_CLASS);
        Method method = utilsClass.getDeclaredMethod(
            "makeProcessorProperties",
            DataTransferProcessorDescriptor.class,
            Map.class
        );
        method.setAccessible(true);
        return (Map<String, Object>) method.invoke(null, descriptor, processorProperties);
    }

    @NotNull
    private String resolveNodePath(@NotNull WebSession session) throws Exception {
        DBRProgressMonitor progressMonitor = session.getProgressMonitor();
        DBNModel navigatorModel = session.getNavigatorModelOrThrow();
        DBNProject projectNode = navigatorModel.getRoot().getProjectNode(project);
        Assertions.assertNotNull(projectNode, "Project navigator node not found");
        projectNode.getDatabases().getChildren(progressMonitor);

        DBSObjectContainer rootContainer = DBUtils.getAdapter(DBSObjectContainer.class, webConnectionInfo.getDataSource());
        Assertions.assertNotNull(rootContainer, "Connection is not a database object container");
        DBSEntity table = findEntity(progressMonitor, rootContainer, TABLE_NAME, 4);
        Assertions.assertNotNull(table, TABLE_NAME + " entity not found");

        DBNDatabaseNode tableNode = navigatorModel.getNodeByObject(progressMonitor, table, true);
        Assertions.assertNotNull(tableNode, "Navigator node for " + TABLE_NAME + " not found");
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

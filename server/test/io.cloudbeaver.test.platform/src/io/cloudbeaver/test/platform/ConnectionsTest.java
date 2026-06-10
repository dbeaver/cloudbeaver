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
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ConnectionsTest extends CloudbeaverMockTest {
    private static final String GQL_CONNECTIONS_GET = """
        query userConnections {
          result: userConnections {
            id
            nodePath
          }
        }""";
    private static final String GQL_CONNECTIONS_CREATE = """
        mutation createConnection($config: ConnectionConfig!, $projectId: ID) {
          result: createConnection(config: $config, projectId: $projectId) {
            id
            nodePath
          }
        }""";
    private static final String GQL_COPY_CONNECTION_FROM_NODE = """
        mutation copyConnectionFromNode($nodePath: String!, $config: ConnectionConfig, $projectId: ID) {
          result: copyConnectionFromNode(nodePath: $nodePath, config: $config, projectId: $projectId) {
            id
            nodePath
          }
        }""";
    private static final String GQL_CONNECTIONS_DELETE = """
        mutation deleteConnection($id: ID!, $projectId: ID) {
          result: deleteConnection(id: $id, projectId: $projectId)
        }""";

    @Test
    public void testAPlatformPresence() {
        try {
            System.out.println("APP:: " + GeneralUtils.getProductTitle());
            //CBPlatform.setApplication(testApp);

            Path defaultWorkingFolder = DBWorkbench.getPlatform().getApplication().getDefaultWorkingFolder();
            System.out.println("DBeaver application: " + defaultWorkingFolder);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testBCreateConnection() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);

        Map<String, Object> configuration = new LinkedHashMap<>();
        Map<String, Object> variables = new LinkedHashMap<>();
        variables.put("config", configuration);
        Assertions.assertThrows(
            DBException.class,
            () -> client.sendQuery(GQL_CONNECTIONS_CREATE, variables),
            "Template connection or driver must be specified"
        );
        String templateId = "test_template";
        configuration.put("templateId", templateId);
        Assertions.assertThrows(
            DBException.class,
            () -> client.sendQuery(GQL_CONNECTIONS_CREATE, variables),
            "Template connection '" + templateId + "' not found"
        );

        configuration.remove("templateId");
        configuration.put("driverId", "postgresql:postgres-jdbc");

        Map<String, Object> addedConnection = client.sendQuery(GQL_CONNECTIONS_CREATE, variables);
        Assertions.assertNotNull(addedConnection);
        checkAddedConnection(client, addedConnection);

        String addedConnectionId = JSONUtils.getString(addedConnection, "id");
        String nodePath = JSONUtils.getString(addedConnection, "nodePath");

        Map<String, Object> config1 = Map.of("name", "connection copy");
        Map<String, Object> variables1 = new LinkedHashMap<>();
        variables1.put("projectId", "g_GlobalConfiguration");
        variables1.put("config", config1);
        variables1.put("nodePath", nodePath);

        Assertions.assertThrows(
            DBException.class,
            () -> client.sendQuery(GQL_COPY_CONNECTION_FROM_NODE, variables1)
        );
        variables1.put("projectId", "u_test");
        Map<String, Object> copiedConnection = client.sendQuery(GQL_COPY_CONNECTION_FROM_NODE, variables1);
        Assertions.assertNotNull(copiedConnection);
        checkAddedConnection(client, copiedConnection);
        String copiedConnectionId = JSONUtils.getString(copiedConnection, "id");
        Boolean deleted1 = client.sendQuery(GQL_CONNECTIONS_DELETE, Map.of("id", addedConnectionId));
        Assertions.assertTrue(deleted1);
        Boolean deleted2 = client.sendQuery(GQL_CONNECTIONS_DELETE, Map.of("id", copiedConnectionId));
        Assertions.assertTrue(deleted2);
    }

    private void checkAddedConnection(@NotNull WebGQLClient client, @NotNull Map<String, Object> addedConnection) throws Exception {
        List<Map<String, Object>> connections = client.sendQuery(GQL_CONNECTIONS_GET, null);
        Assertions.assertTrue(connections.contains(addedConnection));
        Assertions.assertNotNull(JSONUtils.getString(addedConnection, "id"));
        String nodePath = JSONUtils.getString(addedConnection, "nodePath");
        Assertions.assertNotNull(nodePath);
    }
}

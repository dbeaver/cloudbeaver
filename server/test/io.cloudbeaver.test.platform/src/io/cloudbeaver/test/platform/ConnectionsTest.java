/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.junit.Assert;
import org.junit.Test;

import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ConnectionsTest extends CloudbeaverMockTest {
    private static final String GQL_CONNECTIONS_GET = """
        query userConnections {
          result: userConnections {
            id
          }
        }""";
    private static final String GQL_CONNECTIONS_CREATE = """
        mutation createConnection($config: ConnectionConfig!, $projectId: ID) {
          result: createConnection(config: $config, projectId: $projectId) {
            id
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
        Assert.assertThrows(
            "Template connection or driver must be specified",
            DBException.class,
            () -> client.sendQuery(GQL_CONNECTIONS_CREATE, variables)
        );
        String templateId = "test_template";
        configuration.put("templateId", templateId);
        Assert.assertThrows(
            "Template connection '" + templateId + "' not found",
            DBException.class,
            () -> client.sendQuery(GQL_CONNECTIONS_CREATE, variables)
        );

        configuration.remove("templateId");
        configuration.put("driverId", "postgresql:postgres-jdbc");

        Map<String, Object> addedConnection = client.sendQuery(GQL_CONNECTIONS_CREATE, variables);

        List<Map<String, Object>> connections = client.sendQuery(GQL_CONNECTIONS_GET, null);
        Assert.assertTrue(connections.contains(addedConnection));
        String connectionId = JSONUtils.getString(addedConnection, "id");
        Assert.assertNotNull(connectionId);
        Assert.assertTrue(client.sendQuery(GQL_CONNECTIONS_DELETE, Map.of("id", connectionId)));
    }
}

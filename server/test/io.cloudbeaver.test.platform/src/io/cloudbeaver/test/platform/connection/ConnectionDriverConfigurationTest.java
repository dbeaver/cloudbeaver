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
package io.cloudbeaver.test.platform.connection;

import io.cloudbeaver.test.platform.CloudbeaverDBTest;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

public class ConnectionDriverConfigurationTest extends CloudbeaverDBTest {

    private static final String GQL_CONNECTION_DRIVER_CONFIGURATION = """
        query connectionInfo($projectId: ID!, $connectionId: ID!) {
          result: connectionInfo(projectId: $projectId, id: $connectionId) {
            id
            driverConfiguration {
              supportedInsertReplaceMethods {
                id
                name
                description
              }
              supportsBulkLoad
              supportsTransactions
            }
          }
        }""";

    @Test
    public void connectionExposesDriverConfiguration() throws Exception {
        Map<String, Object> connection = client.sendQuery(
            GQL_CONNECTION_DRIVER_CONFIGURATION,
            Map.of(
                "projectId", globalProject.getId(),
                "connectionId", databaseContainer.getId()
            )
        );
        Assertions.assertNotNull(connection);
        Assertions.assertEquals(databaseContainer.getId(), JSONUtils.getString(connection, "id"));

        Map<String, Object> driverConfiguration = JSONUtils.getObjectOrNull(connection, "driverConfiguration");
        Assertions.assertNotNull(driverConfiguration, "driverConfiguration must be present on a connection");

        List<Map<String, Object>> replaceMethods =
            JSONUtils.getObjectList(driverConfiguration, "supportedInsertReplaceMethods");
        Assertions.assertNotNull(replaceMethods, "supportedInsertReplaceMethods must be a non-null list");

        for (Map<String, Object> replaceMethod : replaceMethods) {
            Assertions.assertNotNull(JSONUtils.getString(replaceMethod, "id"), "replace method id must not be null");
            Assertions.assertNotNull(JSONUtils.getString(replaceMethod, "name"), "replace method name must not be null");
        }
    }
}

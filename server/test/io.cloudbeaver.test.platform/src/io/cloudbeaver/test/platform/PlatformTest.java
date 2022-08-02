/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.CommonUtils;
import org.junit.Test;

import java.net.http.HttpClient;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class PlatformTest {

    public static final String GQL_TEMPLATE_CREATE_CONNECTION = "createConnection.json";
    public static final String GQL_TEMPLATE_DELETE_CONNECTION = "deleteConnection.json";
    public static final String GQL_TEMPLATE_USER_CONNECTIONS = "userConnections.json";

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
        HttpClient client = AllTests.getClient();
        List<Map<String, Object>> connections = getUserConnections(client);
        Map<String, Object> addedConnection = createConnection(client);
        if (!getUserConnections(client).contains(addedConnection)) {
            throw new Exception("The new connection was not added");
        }
        boolean deleteConnection = deleteConnection(client, CommonUtils.toString(addedConnection.get("id")));
        if (!deleteConnection) {
            throw new Exception("The new connection was not deleted");
        }
    }

    private List<Map<String, Object>> getUserConnections(HttpClient client) throws Exception {
        String input = AllTests.readScriptTemplate(GQL_TEMPLATE_USER_CONNECTIONS, AllTests.getScriptsPath());
        Map<String, Object> map = AllTests.doPost(input, client);
        Map<String, Object> data = JSONUtils.getObjectOrNull(map, "data");
        if (data != null) {
            return JSONUtils.getObjectList(data, "userConnections");
        }
        return Collections.emptyList();
    }

    private Map<String, Object> createConnection(HttpClient client) throws Exception {
        String input = AllTests.readScriptTemplate(GQL_TEMPLATE_CREATE_CONNECTION, AllTests.getScriptsPath());
        Map<String, Object> map = AllTests.doPost(input, client);
        Map<String, Object> data = JSONUtils.getObjectOrNull(map, "data");
        if (data != null) {
            return JSONUtils.getObjectOrNull(data, "createConnection");
        }
        return Collections.emptyMap();
    }

    private boolean deleteConnection(HttpClient client, String connectionId) throws Exception {
        String input = AllTests.readScriptTemplate(GQL_TEMPLATE_DELETE_CONNECTION, AllTests.getScriptsPath())
            .replace("${connectionId}", connectionId);
        Map<String, Object> map = AllTests.doPost(input, client);
        Map<String, Object> data = JSONUtils.getObjectOrNull(map, "data");
        if (data != null) {
            return JSONUtils.getBoolean(data, "deleteConnection");
        }
        return false;
    }
}

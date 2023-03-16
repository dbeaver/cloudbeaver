/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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

import io.cloudbeaver.model.rm.local.LocalResourceController;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.utils.WebTestUtils;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.CommonUtils;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;

import java.net.CookieManager;
import java.net.http.HttpClient;
import java.util.Map;

public class ResourceManagerTest {

    public static final String GQL_TEMPLATE_RM_WRITE_RESOURCE = "rmWriteResource.json";
    public static final String GQL_TEMPLATE_RM_DELETE_RESOURCE = "navDeleteNode.json";
    public static final String GQL_READ_EMPTY_PROJECT_ID_RESOURCES = "rmReadEmptyProjectIdResources.json";

    private static HttpClient client;

    @BeforeClass
    public static void init() throws Exception {
        Assert.assertTrue(CBApplication.getInstance().getAppConfiguration().isResourceManagerEnabled());
        client = HttpClient.newBuilder()
            .cookieHandler(new CookieManager())
            .version(HttpClient.Version.HTTP_2)
            .build();
        Map<String, Object> authInfo = WebTestUtils.authenticateUser(
            client, CEServerTestSuite.getScriptsPath(), CEServerTestSuite.GQL_API_URL);
        Assert.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));

    }

    @Test
    public void createDeleteResourceTest() throws Exception {
        Assert.assertTrue(createResource(client, false));
        Assert.assertFalse(createResource(client, false));
        Assert.assertTrue(createResource(client, true));
        Assert.assertEquals(1, deleteResource(client));
    }

    @Test
    public void listResourcesWithInvalidProjectId() throws Exception {
        String input = WebTestUtils.readScriptTemplate(GQL_READ_EMPTY_PROJECT_ID_RESOURCES, CEServerTestSuite.getScriptsPath());
        Map<String, Object> map = WebTestUtils.doPost(CEServerTestSuite.GQL_API_URL, input, client);
        var errors = JSONUtils.getObjectList(map, "errors");
        Assert.assertFalse("No errors happened with empty project id request", errors.isEmpty());
        var rmError = errors.get(0);
        //FIXME stupid way to validate error
        Assert.assertTrue(JSONUtils.getString(rmError, "message", "").contains("Project id is empty"));
    }

    private boolean createResource(HttpClient client, boolean forceOverwrite) throws Exception {
        String input = WebTestUtils.readScriptTemplate(
            GQL_TEMPLATE_RM_WRITE_RESOURCE, CEServerTestSuite.getScriptsPath()
        ).replaceAll("\\{forceOverwrite}", CommonUtils.toString(forceOverwrite));
        Map<String, Object> map = WebTestUtils.doPost(CEServerTestSuite.GQL_API_URL, input, client);
        Map<String, Object> data = JSONUtils.getObjectOrNull(map, "data");
        if (data != null) {
            return LocalResourceController.DEFAULT_CHANGE_ID.equals(JSONUtils.getString(data, "rmWriteResourceStringContent"));
        }
        return false;
    }

    private int deleteResource(HttpClient client) throws Exception {
        String input = WebTestUtils.readScriptTemplate(GQL_TEMPLATE_RM_DELETE_RESOURCE, CEServerTestSuite.getScriptsPath());
        Map<String, Object> map = WebTestUtils.doPost(CEServerTestSuite.GQL_API_URL, input, client);
        Map<String, Object> data = JSONUtils.getObjectOrNull(map, "data");
        if (data != null) {
            return JSONUtils.getInteger(data, "navDeleteNodes");
        }
        return -1;
    }

}

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
import io.cloudbeaver.model.rm.local.LocalResourceController;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.IOUtils;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;

import java.nio.file.Path;
import java.util.Map;

public class ResourceManagerTest extends CloudbeaverMockTest {

    private static WebGQLClient client;
    private static final String GQL_RESOURCES_CREATE = """
        mutation rmWriteResourceStringContent($projectId: String!, $resourcePath: String!, $data: String!, $forceOverwrite: Boolean!) {
          result: rmWriteResourceStringContent(
            projectId: $projectId
            resourcePath: $resourcePath
            data: $data
            forceOverwrite: $forceOverwrite
          )
        }""";
    private static final String GQL_RESOURCES_DELETE = """
        mutation rmDeleteResource($projectId: String!, $resourcePath: String!, $recursive: Boolean!) {
          result: rmDeleteResource(
            projectId: $projectId
            resourcePath: $resourcePath
            recursive: $recursive
          )
        }""";
    private static final String GQL_RESOURCES_LIST = """
        query rmListResources($projectId: String!, $folder: String, $nameMask: String, $readProperties: Boolean, $readHistory: Boolean) {
          result: rmListResources(
            projectId: $projectId
            folder: $folder
            nameMask: $nameMask
            readProperties: $readProperties
            readHistory: $readHistory
          ) {
            name
            folder
          }
        }""";

    @BeforeClass
    public static void init() throws Exception {
        Assert.assertTrue(CBApplication.getInstance().getAppConfiguration().isResourceManagerEnabled());
        client = CEAppStarter.createClient();
        Map<String, Object> authInfo = CEAppStarter.authenticateTestUser(client);
        Assert.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));
    }

    @Test
    public void createDeleteResourceTest() throws Exception {
        String projectId = "u_test";
        String resourcePath = "testScript.sql";
        Assert.assertTrue(createResource(projectId, resourcePath, false));
        Assert.assertThrows(
            "Resource '" + IOUtils.getFileNameWithoutExtension(Path.of(resourcePath)) + "' already exists",
            DBException.class,
            () -> createResource(projectId, resourcePath, false)
        );
        Assert.assertTrue(createResource(projectId, resourcePath, true));
        Assert.assertTrue(deleteResource(projectId, resourcePath));
    }

    @Test
    public void listResourcesWithInvalidProjectId() throws Exception {
        Assert.assertThrows(
            "Project id is empty",
            DBException.class,
            () -> client.sendQuery(GQL_RESOURCES_LIST, Map.of("projectId", ""))
        );
    }

    private boolean createResource(@NotNull String projectId, @NotNull String resourcePath, boolean forceOverwrite) throws Exception {
        Map<String, Object> variables = Map.of(
            "projectId", projectId,
            "resourcePath", resourcePath,
            "data", "TEST SCRIPT",
            "forceOverwrite", forceOverwrite
        );
        String data = client.sendQuery(GQL_RESOURCES_CREATE, variables);
        return LocalResourceController.DEFAULT_CHANGE_ID.equals(data);
    }

    private boolean deleteResource(@NotNull String projectId, @NotNull String resourcePath) throws Exception {
        Map<String, Object> variables = Map.of(
            "projectId", projectId,
            "resourcePath", resourcePath,
            "recursive", false
        );
        return client.sendQuery(GQL_RESOURCES_DELETE, variables);
    }

}

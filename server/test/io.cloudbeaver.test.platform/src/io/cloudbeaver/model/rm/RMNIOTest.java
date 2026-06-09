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
package io.cloudbeaver.model.rm;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.rm.nio.RMNIOFileSystem;
import io.cloudbeaver.service.rm.nio.RMNIOFileSystemProvider;
import io.cloudbeaver.service.rm.nio.RMPath;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.utils.SecurityUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class RMNIOTest extends CloudbeaverMockTest {

    private static WebSession webSession;
    private static RMProject testProject;
    private static RMNIOFileSystemProvider rmFsProvider;

    @BeforeAll
    public static void init() throws Exception {
        CEAppStarter.startServerIfNotStarted();
        WebGQLClient client = CEAppStarter.createClient();
        Map<String, Object> authInfo = CEAppStarter.authenticateTestUser(client);
        Assertions.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));

        String sessionId = client.getSessionIdCookie();
        webSession = (WebSession) CEAppStarter.getTestApp().getSessionManager().getSession(sessionId);
        Assertions.assertNotNull(webSession);
        var projectName = "NIO_Test" + SecurityUtils.generateUniqueId();
        testProject = webSession.getRmController().createProject(projectName, null);
        rmFsProvider = new RMNIOFileSystemProvider(webSession.getRmController());
    }

    @AfterAll
    public static void destroy() throws Exception {
        if (webSession != null && testProject != null) {
            webSession.getUserContext().getRmController().deleteProject(testProject.getId());
        }
    }

    @Test
    public void projectPathTest() throws DBException {
        var projectUri = getProjectUri();
        RMPath path = (RMPath) rmFsProvider.getPath(projectUri);
        Assertions.assertEquals(path.getRmProjectId(), testProject.getId());
        Assertions.assertTrue(path.isProjectPath());
        Assertions.assertTrue(path.isAbsolute());
        Assertions.assertNull(path.getParent());
        Assertions.assertNull(path.getRoot());
        Assertions.assertTrue(Files.isDirectory(path));
        Assertions.assertTrue(Files.exists(path));
    }

    @Test
    public void testNotExistProject() {
        RMPath notExistPath = new RMPath(new RMNIOFileSystem("s_not_exist", rmFsProvider));
        Assertions.assertFalse(Files.exists(notExistPath));
    }

    @Test
    public void testNioProjectOperations() throws IOException, DBException {
        var randomName = SecurityUtils.generateUniqueId();
        String randomProject = "s_random_project_" + randomName;

        RMPath newProjectPath = new RMPath(new RMNIOFileSystem(randomProject, rmFsProvider));
        Assertions.assertFalse(Files.exists(newProjectPath));

        //create project via nio
        Files.createDirectory(newProjectPath);
        Assertions.assertTrue(Files.exists(newProjectPath));
        Assertions.assertNotNull(webSession.getRmController().getProject(randomProject, false, false));

        //delete project via nio
        Files.delete(newProjectPath);
        Assertions.assertFalse(Files.exists(newProjectPath));
        Assertions.assertNull(webSession.getRmController().getProject(randomProject, false, false));
    }

    @Test
    public void testResolve() {
        RMPath rootPath = (RMPath) rmFsProvider.getPath(getProjectUri());
        String scriptName = "child.sql";
        Path scriptPath = rootPath.resolve(scriptName);
        Assertions.assertEquals(getProjectUri() + "/" + "child.sql", scriptPath.toString());
    }

    @Test
    public void testListFiles() throws DBException, IOException {
        RMPath rootPath = (RMPath) rmFsProvider.getPath(getProjectUri());
        RMController rm = webSession.getRmController();
        String file1 = "folder" + SecurityUtils.generateUniqueId();
        String file2 = "script" + SecurityUtils.generateUniqueId() + ".sql";
        rm.createResource(testProject.getId(), file1, true);
        rm.createResource(testProject.getId(), file2, false);
        try (Stream<Path> list = Files.list(rootPath)) {
            Set<String> filesFromNio =
                list
                    .map(path -> ((RMPath) path).getResourcePath())
                    .collect(Collectors.toSet());
            Assertions.assertTrue(filesFromNio.contains(file1));
            Assertions.assertTrue(filesFromNio.contains(file2));
        }
    }

    @Test
    public void testWriteResource() throws IOException, DBException {
        RMPath rootPath = (RMPath) rmFsProvider.getPath(getProjectUri());
        RMController rm = webSession.getRmController();
        String script = "test_script_" + SecurityUtils.generateUniqueId() + ".sql";
        RMPath scriptPath = (RMPath) rootPath.resolve(script);

        //create file
        Files.createFile(scriptPath);
        Assertions.assertTrue(Files.exists(scriptPath));
        Assertions.assertNotNull(rm.getResource(testProject.getId(), script));

        //set content rm://s_test_project/test_script.sql

        String sql = "select " + SecurityUtils.getRandom().nextInt(1000);
        Files.writeString(scriptPath, sql);
        String dataFromNio = Files.readString(scriptPath);
        String dataFromRM = new String(rm.getResourceContents(testProject.getId(), script));
        Assertions.assertEquals(sql, dataFromNio);
        Assertions.assertEquals(sql, dataFromRM);

        //delete
        Files.delete(scriptPath);
        Assertions.assertFalse(Files.exists(scriptPath));
        Assertions.assertNull(rm.getResource(testProject.getId(), script));
    }


    private URI getProjectUri() {
        return URI.create("rm://" + testProject.getId());
    }
}

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
package io.cloudbeaver.test.platform.fs;

import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.model.fs.WebFSUtils;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.dbeaver.DBException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

public class FileSystemSecurityTest {
    @Test
    public void unauthorizedSessionCannotUseFileSystemApi() {
        WebGQLClient client = CEAppStarter.createClient();
        String listFileSystems = """
            query listFileSystems($projectId: ID!) {
              result: fsListFileSystems(projectId: $projectId) {
                id
              }
            }""";
        String createFile = """
            mutation createFile($parentPath: String!, $fileName: String!) {
              result: fsCreateFile(parentPath: $parentPath, fileName: $fileName) {
                name
              }
            }""";

        Assertions.assertThrows(
            DBException.class,
            () -> client.sendQuery(listFileSystems, Map.of("projectId", "g_GlobalConfiguration"))
        );
        Assertions.assertThrows(
            DBException.class,
            () -> client.sendQuery(createFile, Map.of("parentPath", "invalid", "fileName", "test.sql"))
        );
    }

    @Test
    public void resolvesDirectChildNames() throws DBException {
        Path parent = Path.of("workspace", "files");

        Assertions.assertEquals(
            parent.resolve("script.sql"),
            WebFSUtils.resolveSafeChild(parent, "script.sql")
        );
        Assertions.assertEquals(parent.resolve(".env"), WebFSUtils.resolveSafeChild(parent, ".env"));
        Assertions.assertEquals(
            parent.resolve("name with spaces"),
            WebFSUtils.resolveSafeChild(parent, "name with spaces")
        );
    }

    @Test
    public void rejectsPathsOutsideDirectParent() {
        Path parent = Path.of("workspace", "files");
        List<String> invalidNames = List.of(
            "",
            " ",
            ".",
            "..",
            "../escape",
            "..\\escape",
            "folder/file",
            "folder\\file",
            "/absolute",
            "C:\\absolute",
            "C:relative",
            "\\\\server\\share",
            "\0"
        );

        for (String invalidName : invalidNames) {
            Assertions.assertThrows(
                DBException.class,
                () -> WebFSUtils.resolveSafeChild(parent, invalidName),
                () -> "Path must be rejected: " + invalidName
            );
        }
    }
}

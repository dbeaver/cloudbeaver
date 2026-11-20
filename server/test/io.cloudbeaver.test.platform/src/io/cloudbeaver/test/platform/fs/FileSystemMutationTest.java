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

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.model.fs.WebFSUtils;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystem;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystemRoot;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.fs.DBNFileSystem;
import org.jkiss.dbeaver.model.navigator.fs.DBNFileSystemRoot;
import org.jkiss.dbeaver.model.navigator.fs.DBNPath;
import org.jkiss.dbeaver.model.navigator.fs.DBNPathBase;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mockito;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Regression coverage for dbeaver/pro#11678: mutation results must work with a lazy destination cache.
 */
public class FileSystemMutationTest extends CloudbeaverMockTest {
    private static final String FILE_NAME = "script with spaces.sql";
    private static final String FOLDER_NAME = "new folder";
    private static final String CONTENT = "select 'regression λ';\nselect 11678;\n";
    private static final String EXISTING_FILE = "existing.sql";
    private static final String EXISTING_FOLDER = "existing folder";
    private static final String SOURCE_SIBLING = "untouched.sql";
    private static final String GQL_MOVE = """
        mutation move($nodePath: String!, $parentPath: String!) {
          result: fsMove(nodePath: $nodePath, toParentNodePath: $parentPath) { name length folder nodePath }
        }""";
    private static final String GQL_COPY = """
        mutation copy($nodePath: String!, $parentPath: String!) {
          result: fsCopy(nodePath: $nodePath, toParentNodePath: $parentPath) { name length folder nodePath }
        }""";
    private static final String GQL_CREATE_FILE = """
        mutation createFile($parentPath: String!, $name: String!) {
          result: fsCreateFile(parentPath: $parentPath, fileName: $name) { name length folder nodePath }
        }""";
    private static final String GQL_CREATE_FOLDER = """
        mutation createFolder($parentPath: String!, $name: String!) {
          result: fsCreateFolder(parentPath: $parentPath, folderName: $name) { name length folder nodePath }
        }""";
    private static final String GQL_LIST_FILES = """
        query listFiles($folderPath: String!) {
          result: fsListFiles(folderPath: $folderPath) { name length folder nodePath }
        }""";

    private WebGQLClient client;
    private WebSession session;
    private DBNPathBase source;
    private DBNPathBase destination;

    @BeforeEach
    public void createLocalFileSystem(@TempDir @NotNull Path temporaryDirectory) throws Exception {
        Path sourcePath = Files.createDirectory(temporaryDirectory.resolve("source"));
        Files.writeString(sourcePath.resolve(FILE_NAME), CONTENT);
        Files.writeString(sourcePath.resolve(SOURCE_SIBLING), "source sibling");
        Path destinationPath = Files.createDirectory(temporaryDirectory.resolve("destination"));
        Files.writeString(destinationPath.resolve(EXISTING_FILE), "destination sibling");
        Files.createDirectory(destinationPath.resolve(EXISTING_FOLDER));
        Files.writeString(destinationPath.resolve(EXISTING_FOLDER).resolve("nested.sql"), "nested sibling");

        client = CEAppStarter.createClient();
        Map<String, Object> auth = CEAppStarter.authenticateTestUser(client);
        Assertions.assertEquals(SMAuthStatus.SUCCESS.name(), auth.get("authStatus"));
        session = (WebSession) CEAppStarter.getTestApp().getSessionManager().getSession(client.getSessionIdCookie());
        Assertions.assertNotNull(session);

        // Only provider metadata is stubbed. Traversal, disk enumeration and all lazy caches are real.
        DBFVirtualFileSystem fileSystem = Mockito.mock(DBFVirtualFileSystem.class);
        DBFVirtualFileSystemRoot root = Mockito.mock(DBFVirtualFileSystemRoot.class);
        Mockito.when(fileSystem.getId()).thenReturn("mutation-test");
        Mockito.when(fileSystem.getRootFolders(Mockito.any(DBRProgressMonitor.class)))
            .thenAnswer(invocation -> List.of(root));
        Mockito.when(fileSystem.isDirectory(Mockito.any(Path.class)))
            .thenAnswer(invocation -> Files.isDirectory(invocation.getArgument(0, Path.class)));
        Mockito.when(root.getFileSystem()).thenReturn(fileSystem);
        Mockito.when(root.getName()).thenReturn("temporary");
        Mockito.when(root.getRootId()).thenReturn("temporary");
        Mockito.when(root.getRootPath(Mockito.any(DBRProgressMonitor.class))).thenReturn(temporaryDirectory);

        var navigatorRoot = session.getNavigatorModelOrThrow().getRoot();
        DBNFileSystem fileSystemNode = new DBNFileSystem(navigatorRoot, fileSystem);
        navigatorRoot.getExtraNodes().add(fileSystemNode);
        DBNFileSystemRoot rootNode = fileSystemNode.getChildren(session.getProgressMonitor())[0];
        rootNode.getChildren(session.getProgressMonitor());
        source = rootNode.getChild(sourcePath);
        destination = rootNode.getChild(destinationPath);
        Assertions.assertNotNull(source);
        Assertions.assertNotNull(destination);
        Assertions.assertTrue(destination.needsInitialization());
        // Resolving the destination itself must not enumerate its children.
        Assertions.assertSame(destination, WebFSUtils.getNodeByPath(session, destination.getNodeUri()));
        Assertions.assertTrue(destination.needsInitialization());
        source.getChildren(session.getProgressMonitor());
    }

    @AfterEach
    public void closeSession() {
        if (session != null) {
            // Closing the isolated session also disposes the temporary navigator subtree.
            CEAppStarter.getTestApp().getSessionManager().closeSession(session.getSessionId());
        }
    }

    @NotNull
    private static Stream<Arguments> mutations() {
        return Stream.of(
            Arguments.of(Operation.MOVE, CacheState.NEVER_LOADED),
            Arguments.of(Operation.MOVE, CacheState.LOADED),
            Arguments.of(Operation.MOVE, CacheState.REFRESHED),
            Arguments.of(Operation.COPY, CacheState.NEVER_LOADED),
            Arguments.of(Operation.CREATE_FILE, CacheState.NEVER_LOADED),
            Arguments.of(Operation.CREATE_FOLDER, CacheState.NEVER_LOADED)
        );
    }

    @ParameterizedTest(name = "{0} into {1} destination")
    @MethodSource("mutations")
    public void mutationReturnsFileWithoutInitializingDestination(
        @NotNull Operation operation,
        @NotNull CacheState cacheState
    ) throws Exception {
        if (cacheState != CacheState.NEVER_LOADED) {
            assertListing(destination, Set.of(EXISTING_FILE, EXISTING_FOLDER));
            Assertions.assertFalse(destination.needsInitialization());
            if (cacheState == CacheState.REFRESHED) {
                destination.refreshNode(session.getProgressMonitor(), this);
            }
        }
        boolean unloaded = cacheState != CacheState.LOADED;
        Assertions.assertEquals(unloaded, destination.needsInitialization());
        DBNPathBase existingChild = destination.getChild(EXISTING_FILE);
        String name = operation == Operation.CREATE_FOLDER ? FOLDER_NAME : FILE_NAME;
        Path target = destination.getPath().resolve(name);
        Assertions.assertFalse(Files.exists(target));

        Map<String, Object> result = switch (operation) {
            case MOVE, COPY -> client.sendQuery(
                operation == Operation.MOVE ? GQL_MOVE : GQL_COPY,
                Map.of("nodePath", source.getChild(FILE_NAME).getNodeUri(), "parentPath", destination.getNodeUri())
            );
            case CREATE_FILE, CREATE_FOLDER -> client.sendQuery(
                operation == Operation.CREATE_FILE ? GQL_CREATE_FILE : GQL_CREATE_FOLDER,
                Map.of("parentPath", destination.getNodeUri(), "name", name)
            );
        };

        Assertions.assertNotNull(result);
        Assertions.assertAll(
            () -> Assertions.assertEquals(name, result.get("name")),
            () -> Assertions.assertEquals(Files.size(target), ((Number) result.get("length")).longValue()),
            () -> Assertions.assertEquals(operation == Operation.CREATE_FOLDER, result.get("folder")),
            () -> Assertions.assertEquals(new DBNPath(destination, target).getNodeUri(), result.get("nodePath")),
            () -> Assertions.assertEquals(unloaded, destination.needsInitialization(), "Preserve the lazy cache state")
        );
        if (operation == Operation.CREATE_FOLDER) {
            Assertions.assertTrue(Files.isDirectory(target));
            try (Stream<Path> children = Files.list(target)) {
                Assertions.assertEquals(0, children.count());
            }
        } else {
            Assertions.assertTrue(Files.isRegularFile(target));
            Assertions.assertEquals(operation == Operation.CREATE_FILE ? "" : CONTENT, Files.readString(target));
        }
        if (operation == Operation.MOVE) {
            Assertions.assertFalse(Files.exists(source.getPath().resolve(FILE_NAME)));
            Assertions.assertNull(source.getChild(FILE_NAME), "Remove the moved node from the loaded source cache");
        } else {
            Assertions.assertEquals(CONTENT, Files.readString(source.getPath().resolve(FILE_NAME)));
            Assertions.assertNotNull(source.getChild(FILE_NAME));
        }
        Assertions.assertEquals("source sibling", Files.readString(source.getPath().resolve(SOURCE_SIBLING)));
        Assertions.assertEquals("destination sibling", Files.readString(destination.getPath().resolve(EXISTING_FILE)));
        Assertions.assertEquals(
            "nested sibling", Files.readString(destination.getPath().resolve(EXISTING_FOLDER).resolve("nested.sql"))
        );
        if (unloaded) {
            Assertions.assertNull(destination.getChild(target), "The response must not populate an unloaded cache");
        } else {
            Assertions.assertNotNull(destination.getChild(target), "Update an already loaded cache");
            Assertions.assertSame(existingChild, destination.getChild(EXISTING_FILE), "Reuse existing cached siblings");
        }

        // First expansion must see all siblings, not just the mutation result; subsequent reads must not duplicate it.
        Set<String> expectedDestination = Set.of(EXISTING_FILE, EXISTING_FOLDER, name);
        assertListing(destination, expectedDestination);
        Assertions.assertFalse(destination.needsInitialization());
        DBNPathBase cachedTarget = destination.getChild(target);
        Assertions.assertNotNull(cachedTarget);
        Assertions.assertEquals(result.get("nodePath"), cachedTarget.getNodeUri());
        assertListing(destination, expectedDestination);
        Assertions.assertSame(cachedTarget, destination.getChild(target));
        assertListing(source, operation == Operation.MOVE ? Set.of(SOURCE_SIBLING) : Set.of(FILE_NAME, SOURCE_SIBLING));
    }

    private void assertListing(@NotNull DBNPathBase folder, @NotNull Set<String> expectedNames) throws Exception {
        List<Map<String, Object>> files = client.sendQuery(GQL_LIST_FILES, Map.of("folderPath", folder.getNodeUri()));
        Assertions.assertNotNull(files);
        Assertions.assertEquals(expectedNames.size(), files.size(), "Listing must not contain duplicates");
        Assertions.assertEquals(
            expectedNames, files.stream().map(file -> (String) file.get("name")).collect(Collectors.toSet())
        );
        DBNNode[] children = folder.getChildren(session.getProgressMonitor());
        Assertions.assertNotNull(children);
        Assertions.assertEquals(expectedNames.size(), children.length);
        Assertions.assertEquals(expectedNames, Arrays.stream(children).map(DBNNode::getName).collect(Collectors.toSet()));
        try (Stream<Path> paths = Files.list(folder.getPath())) {
            Assertions.assertEquals(
                expectedNames, paths.map(path -> path.getFileName().toString()).collect(Collectors.toSet())
            );
        }
    }

    private enum Operation {
        MOVE, COPY, CREATE_FILE, CREATE_FOLDER
    }

    private enum CacheState {
        NEVER_LOADED, LOADED, REFRESHED
    }
}

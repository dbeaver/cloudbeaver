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
package io.cloudbeaver.service.fs.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.fs.FSUtils;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.fs.DBWServiceFS;
import io.cloudbeaver.service.fs.model.FSFile;
import io.cloudbeaver.service.fs.model.FSFileSystem;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.navigator.DBNProject;
import org.jkiss.dbeaver.model.navigator.fs.DBNFileSystem;
import org.jkiss.dbeaver.model.navigator.fs.DBNFileSystems;
import org.jkiss.dbeaver.model.navigator.fs.DBNPathBase;
import org.jkiss.dbeaver.registry.fs.FileSystemProviderRegistry;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.MessageFormat;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Web file system implementation
 */
public class WebServiceFS implements DBWServiceFS {

    private static final Pattern FORBIDDEN_FILENAME_PATTERN = Pattern.compile("[%#:;№$]");

    @NotNull
    @Override
    public FSFileSystem[] getAvailableFileSystems(@NotNull WebSession webSession, @NotNull String projectId)
        throws DBWebException {
        try {
            DBPProject project = webSession.getProjectById(projectId);
            if (project == null) {
                throw new DBException(MessageFormat.format("Project ''{0}'' is not found in session", projectId));
            }
            DBNProject projectNode = webSession.getNavigatorModelOrThrow().getRoot().getProjectNode(project);
            if (projectNode == null) {
                throw new DBException(MessageFormat.format("Project ''{0}'' is not found in navigator model", projectId));
            }
            DBNFileSystems dbnFileSystems = projectNode.getExtraNode(DBNFileSystems.class);
            var fsRegistry = FileSystemProviderRegistry.getInstance();
            return Arrays.stream(dbnFileSystems.getChildren(webSession.getProgressMonitor()))
                .map(fs -> new FSFileSystem(
                        FSUtils.makeUniqueFsId(fs.getFileSystem()),
                    fs.getNodeUri(),
                        fsRegistry.getProvider(fs.getFileSystem().getProviderId()).getRequiredAuth()
                    )
                )
                .toArray(FSFileSystem[]::new);
        } catch (Exception e) {
            throw new DBWebException("Failed to load file systems: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFileSystem getFileSystem(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull String nodePath
    ) throws DBWebException {
        try {
            var node = webSession.getNavigatorModelOrThrow().getNodeByPath(webSession.getProgressMonitor(), nodePath);
            if (!(node instanceof DBNFileSystem fs)) {
                throw new DBException(MessageFormat.format("Node ''{0}'' is not File System", nodePath));
            }
            var fsRegistry = FileSystemProviderRegistry.getInstance();
            return new FSFileSystem(
                FSUtils.makeUniqueFsId(fs.getFileSystem()),
                fs.getNodeUri(),
                fsRegistry.getProvider(fs.getFileSystem().getProviderId()).getRequiredAuth()
            );
        } catch (Exception e) {
            throw new DBWebException("Failed to get file system: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile getFile(@NotNull WebSession webSession, @NotNull String nodePath)
        throws DBWebException {
        try {
            DBNPathBase node = FSUtils.getNodeByPath(webSession, nodePath);
            return new FSFile(node);
        } catch (Exception e) {
            throw new DBWebException("Failed to found file: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile[] getFiles(@NotNull WebSession webSession, @NotNull String parentPath)
        throws DBWebException {
        try {
            DBNPathBase folderPath = FSUtils.getNodeByPath(webSession, parentPath);
            var children = folderPath.getChildren(webSession.getProgressMonitor());
            return Arrays.stream(children)
                .filter(c -> c instanceof DBNPathBase)
                .map(c -> (DBNPathBase) c)
                .map(FSFile::new)
                .toArray(FSFile[]::new);
        } catch (Exception e) {
            throw new DBWebException("Failed to list files: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public String readFileContent(@NotNull WebSession webSession, @NotNull String nodePath)
        throws DBWebException {
        try {
            Path filePath = FSUtils.getPathFromNode(webSession, nodePath);
            var data = Files.readAllBytes(filePath);
            return new String(data, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new DBWebException("Failed to read file content: " + e.getMessage(), e);
        }
    }

    @Override
    public FSFile writeFileContent(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull String data,
        boolean forceOverwrite
    )
        throws DBWebException {
        try {
            DBNPathBase node = FSUtils.getNodeByPath(webSession, nodePath);
            Path filePath = node.getPath();
            if (!forceOverwrite) {
                throw new DBException("Cannot overwrite exist file");
            }
            Files.writeString(filePath, data);
            return new FSFile(node);
        } catch (Exception e) {
            throw new DBWebException("Failed to write file content: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile createFile(
        @NotNull WebSession webSession,
        @NotNull String parentPath,
        @NotNull String fileName
    ) throws DBWebException {
        try {
            DBNPathBase parentNode = FSUtils.getNodeByPath(webSession, parentPath);
            if (!Files.isDirectory(parentNode.getPath())) {
                throw new DBException(MessageFormat.format("Node ''{0}'' is not a directory", parentPath));
            }
            Path filePath = parentNode.getPath().resolve(fileName);
            Files.createFile(filePath);
            parentNode.addChildResource(filePath);
            return new FSFile(parentNode.getChild(filePath));
        } catch (Exception e) {
            throw new DBWebException("Failed to create file: " + e.getMessage(), e);
        }
    }

    @Override
    public FSFile moveFile(
        @NotNull WebSession webSession,
        @NotNull String oldNodePath,
        @NotNull String parentNodePath
    ) throws DBWebException {
        try {
            DBNPathBase oldNode = FSUtils.getNodeByPath(webSession, oldNodePath);
            DBNPathBase oldParentNode = (DBNPathBase) oldNode.getParentNode();
            String fileName = oldNode.getName();
            DBNPathBase parentNode = FSUtils.getNodeByPath(webSession, parentNodePath);
            Path parentPath = parentNode.getPath();
            if (!Files.isDirectory(parentPath)) {
                throw new DBException(MessageFormat.format("Node ''{0}'' is not a directory", parentPath));
            }
            Path to = Files.move(oldNode.getPath(), parentPath.resolve(fileName));
            // apply changes in navigator node
            oldParentNode.removeChildResource(oldNode.getPath());
            parentNode.addChildResource(to);
            return new FSFile(parentNode.getChild(to));
        } catch (Exception e) {
            throw new DBWebException("Failed to move file: " + e.getMessage(), e);
        }
    }

    @Override
    public FSFile renameFile(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull String newName
    ) throws DBWebException {
        validateFilename(newName);
        try {
            DBNPathBase node = FSUtils.getNodeByPath(webSession, nodePath);
            node.rename(webSession.getProgressMonitor(), newName);
            return new FSFile(node);
        } catch (Exception e) {
            throw new DBWebException("Failed to move file: " + e.getMessage(), e);
        }
    }

    @Override
    public FSFile copyFile(
        @NotNull WebSession webSession,
        @NotNull String oldNodePath,
        @NotNull String parentNodePath
    ) throws DBWebException {
        try {
            DBNPathBase oldNode = FSUtils.getNodeByPath(webSession, oldNodePath);
            String fileName = oldNode.getName();
            DBNPathBase parentNode = FSUtils.getNodeByPath(webSession, parentNodePath);
            Path parentPath = parentNode.getPath();
            if (!Files.isDirectory(parentPath)) {
                throw new DBException(MessageFormat.format("Node ''{0}'' is not a directory", parentPath));
            }
            Path to = Files.copy(oldNode.getPath(), parentPath.resolve(fileName));
            parentNode.addChildResource(to);
            return new FSFile(parentNode.getChild(to));
        } catch (Exception e) {
            throw new DBWebException("Failed to copy file: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile createFolder(
        @NotNull WebSession webSession,
        @NotNull String parentPath,
        @NotNull String folderName
    ) throws DBWebException {
        try {
            DBNPathBase parentNode = FSUtils.getNodeByPath(webSession, parentPath);
            if (!Files.isDirectory(parentNode.getPath())) {
                throw new DBException(MessageFormat.format("Node ''{0}'' is not a directory", parentPath));
            }
            Path folderPath = parentNode.getPath().resolve(folderName);
            Files.createDirectory(folderPath);
            parentNode.addChildResource(folderPath);
            return new FSFile(parentNode.getChild(folderPath));
        } catch (Exception e) {
            throw new DBWebException("Failed to create folder: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean deleteFile(
        @NotNull WebSession webSession,
        @NotNull String nodePath
    ) throws DBWebException {
        try {
            DBNPathBase node = FSUtils.getNodeByPath(webSession, nodePath);
            Path path = node.getPath();
            Files.delete(path);
            DBNPathBase parentNode = (DBNPathBase) node.getParentNode();
            parentNode.removeChildResource(path);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Failed to create folder: " + e.getMessage(), e);
        }
    }

    private void validateFilename(@NotNull String filename) throws DBWebException {
        Matcher matcher = FORBIDDEN_FILENAME_PATTERN.matcher(filename);

        if (matcher.find()) {
            throw new DBWebException(String.format("File %s contains forbidden symbols", filename));
        }
    }
}

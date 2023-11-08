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
package io.cloudbeaver.service.fs.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.fs.FSUtils;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.fs.DBWServiceFS;
import io.cloudbeaver.service.fs.WebFSUtils;
import io.cloudbeaver.service.fs.model.FSFile;
import io.cloudbeaver.service.fs.model.FSFileSystem;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.navigator.fs.DBNPath;
import org.jkiss.dbeaver.model.navigator.fs.DBNPathBase;
import org.jkiss.dbeaver.registry.fs.FileSystemProviderRegistry;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.MessageFormat;
import java.util.Arrays;

/**
 * Web file system implementation
 */
public class WebServiceFS implements DBWServiceFS {

    @NotNull
    @Override
    public FSFileSystem[] getAvailableFileSystems(@NotNull WebSession webSession, @NotNull String projectId)
        throws DBWebException {
        try {
            var fsRegistry = FileSystemProviderRegistry.getInstance();
            return webSession.getFileSystemManager(projectId)
                .getVirtualFileSystems()
                .stream()
                .map(fs -> new FSFileSystem(
                    FSUtils.makeUniqueFsId(fs),
                        fsRegistry.getProvider(fs.getProviderId()).getRequiredAuth()
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
        @NotNull String fileSystemId
    ) throws DBWebException {
        try {
            var fsRegistry = FileSystemProviderRegistry.getInstance();
            return webSession.getFileSystemManager(projectId)
                .getVirtualFileSystems()
                .stream()
                .filter(fs -> FSUtils.makeUniqueFsId(fs).equals(fileSystemId))
                .findFirst()
                .map(fs -> new FSFileSystem(
                    FSUtils.makeUniqueFsId(fs),
                    fsRegistry.getProvider(fs.getProviderId()).getRequiredAuth()
                )).orElseThrow(() -> new DBWebException("File system not found"));
        } catch (Exception e) {
            throw new DBWebException("Failed to get file system: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile getFile(@NotNull WebSession webSession, @NotNull String nodePath)
        throws DBWebException {
        try {
            DBNPathBase node = WebFSUtils.getNodeByPath(webSession, nodePath);
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
            DBNPathBase folderPath = WebFSUtils.getNodeByPath(webSession, parentPath);
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
            Path filePath = WebFSUtils.getPathFromNode(webSession, nodePath);
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
            DBNPathBase node = WebFSUtils.getNodeByPath(webSession, nodePath);
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
            DBNPathBase parentNode = WebFSUtils.getNodeByPath(webSession, parentPath);
            if (!Files.isDirectory(parentNode.getPath())) {
                throw new DBException(MessageFormat.format("Node ''{0}'' is not a directory", parentPath));
            }
            Path filePath = parentNode.getPath().resolve(fileName);
            Files.createFile(filePath);
            parentNode.refreshNode(webSession.getProgressMonitor(), this);
            return new FSFile(new DBNPath(parentNode, filePath));
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
            Path from = WebFSUtils.getPathFromNode(webSession, oldNodePath);
            Path fileName = from.getFileName();
            DBNPathBase parentNode = WebFSUtils.getNodeByPath(webSession, parentNodePath);
            Path parentPath = parentNode.getPath();
            if (!Files.isDirectory(parentPath)) {
                throw new DBException(MessageFormat.format("Node ''{0}'' is not a directory", parentPath));
            }
            Path to = Files.move(from, parentPath.resolve(fileName));
            parentNode.refreshNode(webSession.getProgressMonitor(), this);
            return new FSFile(new DBNPath(parentNode, to));
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
        try {
            DBNPathBase dbnPath = WebFSUtils.getNodeByPath(webSession, nodePath);
            Path oldpath = dbnPath.getPath();
            Path newPath = Files.move(oldpath, oldpath.resolveSibling(newName));
            dbnPath.refreshNode(webSession.getProgressMonitor(), this);
            return new FSFile(new DBNPath(dbnPath.getParentNode(), newPath));
        } catch (Exception e) {
            throw new DBWebException("Failed to move file: " + e.getMessage(), e);
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
            DBNPathBase parentNode = WebFSUtils.getNodeByPath(webSession, parentPath);
            if (!Files.isDirectory(parentNode.getPath())) {
                throw new DBException(MessageFormat.format("Node ''{0}'' is not a directory", parentPath));
            }
            Path folderPath = parentNode.getPath().resolve(folderName);
            Files.createDirectory(folderPath);
            parentNode.refreshNode(webSession.getProgressMonitor(), this);
            return new FSFile(new DBNPath(parentNode, folderPath));
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
            Path filePath = WebFSUtils.getPathFromNode(webSession, nodePath);
            Files.delete(filePath);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Failed to create folder: " + e.getMessage(), e);
        }
    }
}

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
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.fs.DBWServiceFS;
import io.cloudbeaver.service.fs.model.FSFile;
import io.cloudbeaver.service.fs.model.FSFileSystem;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.registry.fs.FileSystemProviderRegistry;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

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
                        fs.getId(),
                    fs.getType(),
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
        @NotNull String fileSystemId,
        @NotNull String fileSystemType
    ) throws DBWebException {
        try {
            var fsRegistry = FileSystemProviderRegistry.getInstance();
            return webSession.getFileSystemManager(projectId)
                .getVirtualFileSystems()
                .stream()
                .filter(fs -> fs.getId().equals(fileSystemId) && fs.getType().equals(fileSystemType))
                .findFirst()
                .map(fs -> new FSFileSystem(
                    fs.getId(),
                    fs.getType(),
                    fsRegistry.getProvider(fs.getProviderId()).getRequiredAuth()
                )).orElseThrow(() -> new DBWebException("File system not found"));
        } catch (Exception e) {
            throw new DBWebException("Failed to get file system: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile getFile(@NotNull WebSession webSession, @NotNull String projectId, @NotNull URI fileUri)
        throws DBWebException {
        try {
            Path filePath = webSession.getFileSystemManager(projectId).getPathFromURI(webSession.getProgressMonitor(), fileUri);
            return new FSFile(filePath);
        } catch (Exception e) {
            throw new DBWebException("Failed to found file: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile[] getFiles(@NotNull WebSession webSession, @NotNull String projectId, @NotNull URI folderURI)
        throws DBWebException {
        try {
            Path folderPath = webSession.getFileSystemManager(projectId).getPathFromURI(webSession.getProgressMonitor(), folderURI);
            try (var filesStream = Files.list(folderPath)) {
                return filesStream.map(FSFile::new)
                    .toArray(FSFile[]::new);
            }
        } catch (Exception e) {
            throw new DBWebException("Failed to list files: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public String readFileContent(@NotNull WebSession webSession, @NotNull String projectId, @NotNull URI fileUri)
        throws DBWebException {
        try {
            Path filePath = webSession.getFileSystemManager(projectId)
                .getPathFromURI(webSession.getProgressMonitor(), fileUri);
            var data = Files.readAllBytes(filePath);
            return new String(data, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new DBWebException("Failed to read file content: " + e.getMessage(), e);
        }
    }

    @Override
    public FSFile writeFileContent(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull URI fileURI,
        @NotNull String data,
        boolean forceOverwrite
    )
        throws DBWebException {
        try {
            Path filePath = webSession.getFileSystemManager(projectId)
                .getPathFromURI(webSession.getProgressMonitor(), fileURI);
            if (!forceOverwrite && Files.exists(filePath)) {
                throw new DBException("Cannot overwrite exist file");
            }
            Files.writeString(filePath, data);
            return new FSFile(filePath);
        } catch (Exception e) {
            throw new DBWebException("Failed to write file content: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile createFile(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull URI fileUri
    ) throws DBWebException {
        try {
            Path filePath = webSession.getFileSystemManager(projectId).getPathFromURI(webSession.getProgressMonitor(), fileUri);
            Files.createFile(filePath);
            return new FSFile(filePath);
        } catch (Exception e) {
            throw new DBWebException("Failed to create file: " + e.getMessage(), e);
        }
    }

    @Override
    public FSFile moveFile(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull URI fromURI,
        @NotNull URI toURI
    ) throws DBWebException {
        try {
            Path from = webSession.getFileSystemManager(projectId).getPathFromURI(webSession.getProgressMonitor(), fromURI);
            Path to = webSession.getFileSystemManager(projectId).getPathFromURI(webSession.getProgressMonitor(), toURI);
            Files.move(from, to);
            return new FSFile(to);
        } catch (Exception e) {
            throw new DBWebException("Failed to move file: " + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile createFolder(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull URI folderURI
    ) throws DBWebException {
        try {
            Path folderPath = webSession.getFileSystemManager(projectId).getPathFromURI(webSession.getProgressMonitor(), folderURI);
            Files.createDirectory(folderPath);
            return new FSFile(folderPath);
        } catch (Exception e) {
            throw new DBWebException("Failed to create folder: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean deleteFile(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull URI fileUri
    ) throws DBWebException {
        try {
            Path filePath = webSession.getFileSystemManager(projectId).getPathFromURI(webSession.getProgressMonitor(), fileUri);
            Files.delete(filePath);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Failed to create folder: " + e.getMessage(), e);
        }
    }
}

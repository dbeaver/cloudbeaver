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
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystem;
import org.jkiss.utils.CommonUtils;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.spi.FileSystemProvider;

/**
 * Web file system implementation
 */
public class WebServiceFS implements DBWServiceFS {

    @NotNull
    @Override
    public String[] getAvailableFileSystems(@NotNull WebSession webSession) {
        return webSession.getFileSystems()
            .stream()
            .map(FileSystemProvider::getScheme)
            .toArray(String[]::new);
    }

    @NotNull
    @Override
    public FSFile getFile(@NotNull WebSession webSession, @NotNull URI fileUri) throws DBWebException {
        try {
            FileSystemProvider fs = getFileSystem(webSession, fileUri);
            Path filePath = fs.getPath(fileUri);
            return new FSFile(filePath);
        } catch (Exception e) {
            throw new DBWebException("Failed to found file:" + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile[] getFiles(@NotNull WebSession webSession, @NotNull URI folderUri) throws DBWebException {
        try {
            FileSystemProvider fs = getFileSystem(webSession, folderUri);
            Path folderPath = fs.getPath(folderUri);
            try (var filesStream = Files.list(folderPath)) {
                return filesStream.map(FSFile::new)
                    .toArray(FSFile[]::new);
            }
        } catch (Exception e) {
            throw new DBWebException("Failed to list files:" + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public String readFileContent(@NotNull WebSession webSession, @NotNull URI fileUri) throws DBWebException {
        try {
            FileSystemProvider fs = getFileSystem(webSession, fileUri);
            Path filePath = fs.getPath(fileUri);
            return Files.readString(filePath);
        } catch (Exception e) {
            throw new DBWebException("Failed to read file content:" + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile createFile(@NotNull WebSession webSession, @NotNull URI fileUri) throws DBWebException {
        try {
            FileSystemProvider fs = getFileSystem(webSession, fileUri);
            Path filePath = fs.getPath(fileUri);
            Files.createFile(filePath);
            return new FSFile(filePath);
        } catch (Exception e) {
            throw new DBWebException("Failed to create file:" + e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public FSFile createFolder(@NotNull WebSession webSession, @NotNull URI fileUri) throws DBWebException {
        try {
            FileSystemProvider fs = getFileSystem(webSession, fileUri);
            Path filePath = fs.getPath(fileUri);
            Files.createDirectory(filePath);
            return new FSFile(filePath);
        } catch (Exception e) {
            throw new DBWebException("Failed to create folder:" + e.getMessage(), e);
        }
    }

    @Override
    public boolean deleteFile(@NotNull WebSession webSession, @NotNull URI fileUri) throws DBWebException {
        try {
            FileSystemProvider fs = getFileSystem(webSession, fileUri);
            Path filePath = fs.getPath(fileUri);
            Files.delete(filePath);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Failed to create folder:" + e.getMessage(), e);
        }
    }

    private FileSystemProvider getFileSystem(@NotNull WebSession webSession, @NotNull URI fileUri) throws DBException {
        String fsId = fileUri.getScheme();
        if (CommonUtils.isEmpty(fsId)) {
            throw new DBException("File system id not present in file uri: " + fileUri);
        }
        FileSystemProvider fs = webSession.getFileSystem(fsId);
        if (fs == null) {
            throw new DBException("File system not found" + fsId);
        }
        return fs;
    }
}

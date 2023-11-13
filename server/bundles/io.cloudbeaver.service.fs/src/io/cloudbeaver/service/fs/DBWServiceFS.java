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
package io.cloudbeaver.service.fs;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWService;
import io.cloudbeaver.service.fs.model.FSFile;
import io.cloudbeaver.service.fs.model.FSFileSystem;
import org.jkiss.code.NotNull;

/**
 * Web service API
 */
public interface DBWServiceFS extends DBWService {
    @NotNull
    FSFileSystem[] getAvailableFileSystems(@NotNull WebSession webSession, @NotNull String projectId)
        throws DBWebException;


    @NotNull
    FSFileSystem getFileSystem(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull String fileSystemId
    ) throws DBWebException;

    @NotNull
    FSFile getFile(
        @NotNull WebSession webSession,
        @NotNull String nodePath
    ) throws DBWebException;

    @NotNull
    FSFile[] getFiles(
        @NotNull WebSession webSession,
        @NotNull String nodePath
    ) throws DBWebException;

    @NotNull
    String readFileContent(
        @NotNull WebSession webSession,
        @NotNull String nodePath
    ) throws DBWebException;

    FSFile writeFileContent(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull String data,
        boolean forceOverwrite
    ) throws DBWebException;

    @NotNull
    FSFile createFile(
        @NotNull WebSession webSession,
        @NotNull String parentPath,
        @NotNull String fileName
    ) throws DBWebException;

    FSFile moveFile(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull String parentNodePath
    ) throws DBWebException;

    FSFile renameFile(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull String newName
    ) throws DBWebException;

    @NotNull
    FSFile createFolder(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull String folderName
    ) throws DBWebException;

    boolean deleteFile(
        @NotNull WebSession webSession,
        @NotNull String nodePath
    ) throws DBWebException;

}

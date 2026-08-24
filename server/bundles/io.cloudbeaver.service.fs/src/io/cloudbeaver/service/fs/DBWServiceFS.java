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
package io.cloudbeaver.service.fs;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWService;
import io.cloudbeaver.service.fs.model.FSFile;
import io.cloudbeaver.service.fs.model.FSFileSystem;
import org.jkiss.code.NotNull;

/**
 * Web service API
 */
public interface DBWServiceFS extends DBWService {
    @WebAction
    @NotNull
    FSFileSystem[] getAvailableFileSystems(@NotNull WebSession webSession, @NotNull String projectId)
        throws DBWebException;


    @WebAction
    @NotNull
    FSFileSystem getFileSystem(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull String fileSystemId
    ) throws DBWebException;

    @WebAction
    @NotNull
    FSFile getFile(
        @NotNull WebSession webSession,
        @NotNull String nodePath
    ) throws DBWebException;

    @WebAction
    @NotNull
    FSFile[] getFiles(
        @NotNull WebSession webSession,
        @NotNull String nodePath
    ) throws DBWebException;

    @WebAction
    @NotNull
    String readFileContent(
        @NotNull WebSession webSession,
        @NotNull String nodePath
    ) throws DBWebException;

    @WebAction
    FSFile writeFileContent(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull String data,
        boolean forceOverwrite
    ) throws DBWebException;

    @WebAction
    @NotNull
    FSFile createFile(
        @NotNull WebSession webSession,
        @NotNull String parentPath,
        @NotNull String fileName
    ) throws DBWebException;

    @WebAction
    FSFile moveFile(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull String parentNodePath
    ) throws DBWebException;

    @WebAction
    FSFile renameFile(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull String newName
    ) throws DBWebException;

    @WebAction
    FSFile copyFile(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull String parentNodePath
    ) throws DBWebException;

    @WebAction
    @NotNull
    FSFile createFolder(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull String folderName
    ) throws DBWebException;

    @WebAction
    boolean deleteFile(
        @NotNull WebSession webSession,
        @NotNull String nodePath
    ) throws DBWebException;

}

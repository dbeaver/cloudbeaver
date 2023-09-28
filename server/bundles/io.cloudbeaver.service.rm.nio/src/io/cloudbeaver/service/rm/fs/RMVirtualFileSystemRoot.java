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
package io.cloudbeaver.service.rm.fs;

import io.cloudbeaver.service.rm.nio.RMNIOFileSystemProvider;
import io.cloudbeaver.service.rm.nio.RMNIOFileSystem;
import io.cloudbeaver.service.rm.nio.RMPath;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystem;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystemRoot;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.nio.file.Path;

public class RMVirtualFileSystemRoot implements DBFVirtualFileSystemRoot {
    @NotNull
    private final RMVirtualFileSystem rmFileSystem;
    @NotNull
    private final RMProject rmProject;
    @NotNull
    private final RMNIOFileSystemProvider rmNioFileSystemProvider;

    public RMVirtualFileSystemRoot(
        @NotNull RMVirtualFileSystem rmFileSystem,
        @NotNull RMProject rmProject,
        @NotNull RMNIOFileSystemProvider rmNioFileSystemProvider
    ) {
        this.rmFileSystem = rmFileSystem;
        this.rmProject = rmProject;
        this.rmNioFileSystemProvider = rmNioFileSystemProvider;
    }

    @NotNull
    @Override
    public String getName() {
        return rmProject.getName();
    }

    @NotNull
    @Override
    public DBFVirtualFileSystem getFileSystem() {
        return rmFileSystem;
    }

    @NotNull
    @Override
    public String getRootId() {
        return rmProject.getId();
    }

    @Override
    public DBPImage getRootIcon() {
        return null;
    }

    @NotNull
    @Override
    public Path getRootPath(DBRProgressMonitor monitor) {
        return new RMPath(new RMNIOFileSystem(rmProject.getId(), rmNioFileSystemProvider));
    }
}

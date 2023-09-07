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
package io.cloudbeaver.model.rm.fs;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystem;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystemRoot;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.nio.file.Path;

public class RMVirtualFileSystemRoot implements DBFVirtualFileSystemRoot {
    private final RMVirtualFileSystem rmFileSystem;
    private final RMResource rmResource;

    public RMVirtualFileSystemRoot(RMVirtualFileSystem rmFileSystem, RMResource rmResource) {
        this.rmFileSystem = rmFileSystem;
        this.rmResource = rmResource;
    }

    @NotNull
    @Override
    public String getName() {
        return rmResource.getName();
    }

    @NotNull
    @Override
    public DBFVirtualFileSystem getFileSystem() {
        return rmFileSystem;
    }

    @NotNull
    @Override
    public String getRootId() {
        return rmResource.getName();
    }

    @Override
    public DBPImage getRootIcon() {
        return null;
    }

    @NotNull
    @Override
    public Path getRootPath(DBRProgressMonitor monitor) throws DBException {
        return null;
    }
}

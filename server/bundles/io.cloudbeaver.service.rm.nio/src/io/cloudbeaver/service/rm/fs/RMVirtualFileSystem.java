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

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.rm.nio.RMNIOFileSystemProvider;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystem;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystemRoot;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.net.URI;
import java.nio.file.Path;

public class RMVirtualFileSystem implements DBFVirtualFileSystem {
    @NotNull
    private final RMNIOFileSystemProvider rmNioFileSystemProvider;

    @NotNull
    private final RMProject rmProject;
    public RMVirtualFileSystem(@NotNull WebSession webSession, @NotNull RMProject rmProject) {
        this.rmNioFileSystemProvider = new RMNIOFileSystemProvider(webSession.getRmController());
        this.rmProject = rmProject;
    }

    @NotNull
    @Override
    public String getFileSystemDisplayName() {
        return "RM";
    }

    @NotNull
    @Override
    public String getType() {
        return "rm";
    }

    @Override
    public String getDescription() {
        return "Resource Manager file system";
    }

    @Override
    public DBPImage getIcon() {
        return null;
    }

    @NotNull
    @Override
    public String getId() {
        return rmProject.getId();
    }

    @Override
    public Path of(DBRProgressMonitor monitor, URI uri) {
        return rmNioFileSystemProvider.getPath(uri);
    }

    @NotNull
    @Override
    public DBFVirtualFileSystemRoot[] getRootFolders(DBRProgressMonitor monitor) throws DBException {
        return new RMVirtualFileSystemRoot[]{new RMVirtualFileSystemRoot(this, rmProject, rmNioFileSystemProvider)};
    }
}

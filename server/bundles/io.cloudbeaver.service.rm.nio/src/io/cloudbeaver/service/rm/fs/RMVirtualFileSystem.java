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
package io.cloudbeaver.service.rm.fs;

import io.cloudbeaver.service.rm.nio.RMNIOFileSystemProvider;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.fs.AbstractVirtualFileSystem;
import org.jkiss.dbeaver.model.fs.DBFVirtualFileSystemRoot;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.net.URI;
import java.nio.file.Path;
import java.util.List;

public class RMVirtualFileSystem extends AbstractVirtualFileSystem {
    @NotNull
    private final RMNIOFileSystemProvider rmNioFileSystemProvider;

    @NotNull
    private final RMProject rmProject;

    public RMVirtualFileSystem(@NotNull RMController rmController, @NotNull RMProject rmProject) {
        this.rmNioFileSystemProvider = new RMNIOFileSystemProvider(rmController);
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

    @NotNull
    @Override
    public String getProviderId() {
        return "rm-nio";
    }

    @NotNull
    @Override
    public Path getPathByURI(@NotNull DBRProgressMonitor monitor, @NotNull URI uri) {
        return rmNioFileSystemProvider.getPath(uri);
    }

    @NotNull
    @Override
    public List<? extends DBFVirtualFileSystemRoot> getRootFolders(DBRProgressMonitor monitor) throws DBException {
        return List.of(new RMVirtualFileSystemRoot(this, rmProject, rmNioFileSystemProvider));
    }
}

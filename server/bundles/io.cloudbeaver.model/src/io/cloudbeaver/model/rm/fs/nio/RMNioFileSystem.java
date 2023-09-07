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
package io.cloudbeaver.model.rm.fs.nio;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.nio.DBNioFileSystem;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;

import java.io.IOException;
import java.nio.file.FileStore;
import java.nio.file.Path;
import java.nio.file.spi.FileSystemProvider;
import java.util.List;

public class RMNioFileSystem extends DBNioFileSystem {
    private final RMProject rmProject;
    private final RMController rmController;

    public RMNioFileSystem(RMProject rmProject, RMController rmController) {
        this.rmProject = rmProject;
        this.rmController = rmController;
    }

    @Override
    public FileSystemProvider provider() {
        return null;
    }

    @Override
    public void close() throws IOException {

    }

    @Override
    public boolean isOpen() {
        return true;
    }

    @Override
    public boolean isReadOnly() {
        return rmProject.hasProjectPermission(RMProjectPermission.RESOURCE_EDIT.getPermissionId());
    }

    @Override
    public Iterable<Path> getRootDirectories() {
        return List.of(new RMPath(rmProject));
    }

    @Override
    public Iterable<FileStore> getFileStores() {
        return null;
    }

    @Override
    public Path getPath(@NotNull String first, @NotNull String... more) {
        return null;
    }

}

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
import org.jkiss.dbeaver.model.nio.NIOFileSystem;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.net.URI;
import java.nio.file.FileStore;
import java.nio.file.Path;
import java.nio.file.spi.FileSystemProvider;
import java.util.List;

public class RMNIOFileSystem extends NIOFileSystem {
    private final RMProject rmProject;
    private final RMController rmController;
    private final RMNIOFileSystemProvider rmNioFileSystemProvider;

    public RMNIOFileSystem(RMProject rmProject, RMController rmController, RMNIOFileSystemProvider rmNioFileSystemProvider) {
        this.rmProject = rmProject;
        this.rmController = rmController;
        this.rmNioFileSystemProvider = rmNioFileSystemProvider;
    }

    @Override
    public FileSystemProvider provider() {
        return rmNioFileSystemProvider;
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
        return List.of(new RMPath(this));
    }

    @Override
    public Iterable<FileStore> getFileStores() {
        return List.of(new RMNIOProjectFileStore(rmProject));
    }

    @Override
    public Path getPath(@NotNull String first, @NotNull String... more) {
        if (CommonUtils.isEmpty(first)) {
            throw new IllegalArgumentException("Empty path");
        }
        StringBuilder uriBuilder = new StringBuilder();
        uriBuilder.append(
                provider().getScheme()
            ).append("://")
            .append(rmProject.getId())
            .append(getSeparator())
            .append(first);
        if (!ArrayUtils.isEmpty(more)) {
            uriBuilder
                .append(getSeparator())
                .append(String.join(getSeparator(), more));
        }
        return provider().getPath(URI.create(uriBuilder.toString()));
    }

    public RMController getRmController() {
        return rmController;
    }

    public RMProject getProject() {
        return rmProject;
    }
}

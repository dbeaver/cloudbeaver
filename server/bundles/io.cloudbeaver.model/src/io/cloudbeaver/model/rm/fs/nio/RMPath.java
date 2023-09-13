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
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.nio.NIOPath;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.net.URI;
import java.nio.file.FileStore;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.List;

public class RMPath extends NIOPath {
    @NotNull
    private final RMNIOFileSystem rmNioFileSystem;
    @NotNull
    private final RMProject rmProject;
    @NotNull
    private final List<RMResource> parentResources;
    @Nullable
    private final RMResource rmResource;
    @NotNull
    private final FileStore fileStore;

    public RMPath(
        @NotNull RMNIOFileSystem rmNioFileSystem
    ) {
        this.rmNioFileSystem = rmNioFileSystem;
        this.rmProject = rmNioFileSystem.getProject();
        this.fileStore = new RMNIOProjectFileStore(rmProject);
        this.parentResources = List.of();
        this.rmResource = null;
    }

    public RMPath(
        @NotNull RMNIOFileSystem rmNioFileSystem,
        @NotNull List<RMResource> parentResources,
        @NotNull RMResource rmResource
    ) {
        this.rmNioFileSystem = rmNioFileSystem;
        this.rmProject = rmNioFileSystem.getProject();
        this.parentResources = parentResources;
        this.rmResource = rmResource;
        this.fileStore = new RMNIOResourceFileStore(rmResource);
    }

    @Override
    public RMNIOFileSystem getFileSystem() {
        return rmNioFileSystem;
    }

    @Override
    public boolean isAbsolute() {
        return true;
    }

    @Override
    public Path getRoot() {
        return new RMPath(rmNioFileSystem);
    }

    @Override
    public Path getFileName() {
        return this;
    }

    @Override
    public Path getParent() {
        // project is root and have no parent
        if (rmResource == null) {
            return null;
        }
        if (CommonUtils.isEmpty(parentResources)) {
            return getRoot();
        }
        var parentResource = parentResources.get(parentResources.size() - 1);
        return new RMPath(rmNioFileSystem, parentResources.subList(0, parentResources.size() - 1), parentResource);
    }

    @Override
    public int getNameCount() {
        return parentResources.size() + (rmResource == null ? 0 : 1);
    }

    @Override
    public boolean startsWith(@NotNull Path other) {
        if (!(other instanceof RMPath)) {
            return false;
        }
        return toString().startsWith(other.toString());
    }

    @Override
    public Path normalize() {
        return this;
    }

    @Override
    public Path resolve(@NotNull Path other) {
        throw new UnsupportedOperationException();
    }

    @Override
    public Path relativize(@NotNull Path other) {
        throw new UnsupportedOperationException();
    }

    @Override
    public URI toUri() {
        var fileSystem = getFileSystem();
        var uriBuilder = new StringBuilder(fileSystem.provider().getScheme())
            .append("://")
            .append(rmProject.getId());

        String rmResourcePath = getResourcePath();
        if (rmResourcePath != null) {
            uriBuilder.append(fileSystem.getSeparator())
                .append(rmResourcePath);
        }

        return URI.create(uriBuilder.toString());
    }

    @Override
    public Path toAbsolutePath() {
        if (isAbsolute()) {
            return this;
        }
        throw new IllegalStateException();
    }

    @Override
    public Path toRealPath(@NotNull LinkOption... options) throws IOException {
        return toAbsolutePath();
    }

    public FileStore getFileStore() {
        return fileStore;
    }

    @Nullable
    public String getResourcePath() {
        StringBuilder pathBuilder = new StringBuilder();
        parentResources.forEach(resource -> pathBuilder.append(resource.getName()).append(getFileSystem().getSeparator()));
        if (rmResource != null) {
            pathBuilder.append(rmProject.getName());
        }
        String path = pathBuilder.toString();
        return CommonUtils.nullIfEmpty(path);
    }

    public boolean isProject() {
        return rmResource == null;
    }

    @NotNull
    public RMProject getRmProject() {
        return rmProject;
    }

    @NotNull
    public List<RMResource> getParentResources() {
        return parentResources;
    }

    @Nullable
    public RMResource getRmResource() {
        return rmResource;
    }
}

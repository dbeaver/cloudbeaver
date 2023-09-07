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
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.net.URI;
import java.nio.file.*;
import java.util.List;

public class RMPath implements Path {
    private final RMNioFileSystem rmNioFileSystem;
    @NotNull
    private final RMProject rmProject;
    @NotNull
    private final List<RMResource> parentResources;
    @Nullable
    private final RMResource rmResource;

    public RMPath(@NotNull RMProject rmProject) {
        this.rmProject = rmProject;
        this.parentResources = List.of();
        this.rmResource = null;
    }

    public RMPath(@NotNull RMProject rmProject, @NotNull List<RMResource> parentResources, @Nullable RMResource rmResource) {
        this.rmProject = rmProject;
        this.parentResources = parentResources;
        this.rmResource = rmResource;
    }

    @Override
    public FileSystem getFileSystem() {
        throw rmNioFileSystem;
    }

    @Override
    public boolean isAbsolute() {
        return true;
    }

    @Override
    public Path getRoot() {
        return new RMPath(rmProject);
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
        return new RMPath(rmProject, parentResources.subList(0, parentResources.size() - 1), parentResource);
    }

    @Override
    public int getNameCount() {
        return parentResources.size() + (rmResource == null ? 0 : 1);
    }

    @Override
    public Path getName(int index) {
        return null;
    }

    @Override
    public Path subpath(int beginIndex, int endIndex) {
        return null;
    }

    @Override
    public boolean startsWith(@NotNull Path other) {
        return false;
    }

    @Override
    public boolean endsWith(@NotNull Path other) {
        return false;
    }

    @Override
    public Path normalize() {
        return null;
    }

    @Override
    public Path resolve(@NotNull Path other) {
        return null;
    }

    @Override
    public Path relativize(@NotNull Path other) {
        return null;
    }

    @Override
    public URI toUri() {
        var fileSystem = getFileSystem();
        var uriBuilder = new StringBuilder(fileSystem.provider().getScheme())
            .append("://")
            .append(rmProject.getId());
        parentResources.forEach(resource -> uriBuilder.append(resource.getName()).append(fileSystem.getSeparator()));
        if (rmResource != null) {
            uriBuilder.append(rmProject.getName());
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

    @Override
    public WatchKey register(@NotNull WatchService watcher, @NotNull WatchEvent.Kind<?>[] events, WatchEvent.Modifier... modifiers) throws
        IOException {
        throw new UnsupportedOperationException();
    }

    @Override
    public int compareTo(@NotNull Path other) {
        return toString().compareTo(other.toString());
    }

    @NotNull
    @Override
    public String toString() {
        return toUri().toString();
    }
}

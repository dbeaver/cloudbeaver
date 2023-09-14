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
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.net.URI;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.Arrays;

public class RMPath extends NIOPath {
    @NotNull
    private final RMNIOFileSystem rmNioFileSystem;
    @NotNull
    private final RMProject rmProject;

    public RMPath(
        @NotNull RMNIOFileSystem rmNioFileSystem
    ) {
        super(null);
        this.rmNioFileSystem = rmNioFileSystem;
        this.rmProject = rmNioFileSystem.getProject();
    }

    public RMPath(
        @NotNull RMNIOFileSystem rmNioFileSystem,
        @NotNull String path
    ) {
        super(path);
        this.rmNioFileSystem = rmNioFileSystem;
        this.rmProject = rmNioFileSystem.getProject();
    }

    @Override
    public RMNIOFileSystem getFileSystem() {
        return rmNioFileSystem;
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
        if (isProject()) {
            return null;
        }

        String[] parts = pathParts();
        if (parts.length == 1) {
            return new RMPath(rmNioFileSystem); // project is parent
        }
        //return parent folder
        String[] parentParts = Arrays.copyOfRange(parts, 0, parts.length - 1);
        return new RMPath(rmNioFileSystem, String.join(getFileSystem().getSeparator(), parentParts));
    }

    @Override
    public int getNameCount() {
        return pathParts().length;
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
    public Path resolve(Path other) {
        RMPath rmOther = (RMPath) other;
        if (!rmOther.rmProject.getId().equals(rmProject.getId())) {
            throw new IllegalArgumentException("Cannot resolve path from other project");
        }
        return resolve(rmOther.getResourcePath());
    }

    @Override
    public Path resolve(String other) {
        if (CommonUtils.isEmpty(other)) {
            return this;
        }
        return new RMPath(
            rmNioFileSystem,
            resolveString(other)
        );
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
        return new RMPath(rmNioFileSystem, "/" + path);
    }

    @Override
    public Path toRealPath(@NotNull LinkOption... options) throws IOException {
        return toAbsolutePath();
    }

    @Override
    public Path getName(int index) {
        String[] parts = pathParts();
        if (index < 0 || index > parts.length) {
            throw new IllegalArgumentException("Invalid index value: " + index);
        }
        return new RMPath(rmNioFileSystem, parts[index]);
    }

    @Override
    public Path subpath(int beginIndex, int endIndex) {
        String[] parts = pathParts();
        if (beginIndex < 0 || beginIndex > parts.length) {
            throw new IllegalArgumentException("Invalid begin index value: " + beginIndex);
        }

        if (endIndex < 0 || endIndex > parts.length || endIndex < beginIndex) {
            throw new IllegalArgumentException("Invalid end index value: " + endIndex);
        }

        String[] subParts = Arrays.copyOfRange(parts, beginIndex, endIndex);
        
        return new RMPath(rmNioFileSystem, String.join(getFileSystem().getSeparator(), subParts));
    }

    @Nullable
    public String getResourcePath() {
        return path;
    }

    public boolean isProject() {
        return CommonUtils.isEmpty(path);
    }

    @NotNull
    public RMProject getRmProject() {
        return rmProject;
    }
}

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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.nio.ByteArrayChannel;
import org.jkiss.dbeaver.model.nio.NIOFileSystemProvider;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.utils.CommonUtils;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URI;
import java.nio.channels.SeekableByteChannel;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.FileAttribute;
import java.nio.file.attribute.FileAttributeView;
import java.util.*;

public class RMNIOFileSystemProvider extends NIOFileSystemProvider {
    @NotNull
    private final RMController rmController;

    public RMNIOFileSystemProvider(@NotNull RMController rmController) {
        this.rmController = rmController;
    }

    @Override
    public String getScheme() {
        return "rm";
    }

    @Override
    public FileSystem newFileSystem(URI uri, Map<String, ?> env) throws IOException {
        throw new FileAlreadyExistsException("RM file system already exist");
    }

    @Override
    public FileSystem getFileSystem(URI uri) {
        return null;
    }

    @Override
    public Path getPath(URI uri) {
        validateUri(uri);
        String projectId = uri.getAuthority();
        if (CommonUtils.isEmpty(projectId)) {
            throw new IllegalArgumentException("Project is not specified in URI");
        }
        try {
            RMProject rmProject = rmController.getProject(projectId, false, false);
            if (rmProject == null) {
                throw new IllegalArgumentException("Project not exist " + projectId);
            }
            RMNIOFileSystem rmNioFileSystem = new RMNIOFileSystem(rmProject, rmController, this);
            String resourcePath = uri.getPath();
            if (CommonUtils.isEmpty(resourcePath)) {
                return new RMPath(rmNioFileSystem);
            } else {
                var rmResourcePath = rmController.getResourcePath(
                    rmProject.getId(),
                    resourcePath
                );

                return new RMPath(rmNioFileSystem,
                    Arrays.asList(rmResourcePath).subList(0, rmResourcePath.length - 1),
                    rmResourcePath[resourcePath.length() - 1]
                );
            }
        } catch (DBException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public SeekableByteChannel newByteChannel(Path path, Set<? extends OpenOption> options, FileAttribute<?>... attrs) throws IOException {
        RMPath rmPath = (RMPath) path;
        try {
            byte[] data = rmController.getResourceContents(rmPath.getRmProject().getId(), rmPath.getResourcePath());
            return new ByteArrayChannel(data, true);
        } catch (DBException e) {
            throw new IOException("Failed to read resource: " + e.getMessage(), e);
        }
    }

    @Override
    public DirectoryStream<Path> newDirectoryStream(Path dir, DirectoryStream.Filter<? super Path> filter) throws IOException {
        RMPath rmDir = (RMPath) dir;
        String rmDirPath = rmDir.getResourcePath();
        List<RMResource> parents = new ArrayList<>(rmDir.getParentResources());
        if (!rmDir.isProject()) {
            parents.add(rmDir.getRmResource());
        }

        return new DirectoryStream<>() {
            @Override
            public Iterator<Path> iterator() {
                var rmController = rmDir.getFileSystem().getRmController();
                try {
                    var resources = rmController.listResources(rmDir.getRmProject().getId(),
                        rmDirPath,
                        null,
                        false,
                        false,
                        false);
                    return Arrays.stream(resources)
                        .map(rmResource -> (Path) new RMPath(rmDir.getFileSystem(), parents, rmResource))
                        .iterator();
                } catch (DBException e) {
                    throw new RuntimeException("Failed to read resources from rm path: " + e.getMessage(), e);
                }
            }

            @Override
            public void close() throws IOException {

            }
        };
    }

    @Override
    public void createDirectory(Path dir, FileAttribute<?>... attrs) throws IOException {
        RMPath rmDir = (RMPath) dir;
        try {
            rmController.createResource(rmDir.getRmProject().getId(), rmDir.getResourcePath(), true);
        } catch (DBException e) {
            throw new IOException("Failed to create directory: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(Path path) throws IOException {
        RMPath rmPath = (RMPath) path;
        String resourcePath = rmPath.getResourcePath();
        try {
            if (resourcePath == null) {
                throw new FileNotFoundException("Can not delete: " + rmPath);
            } else {
                rmController.deleteResource(rmPath.getRmProject().getId(), resourcePath, true);
            }
        } catch (DBException e) {
            throw new IOException("Failed to delete rm resource:  " + e.getMessage(), e);
        }
    }

    @Override
    public void copy(Path source, Path target, CopyOption... options) throws IOException {
        throw new UnsupportedOperationException();
    }

    @Override
    public void move(Path source, Path target, CopyOption... options) throws IOException {
        RMPath rmSource = (RMPath) source;
        RMPath rmTarget = (RMPath) target;
        try {
            rmController.moveResource(rmSource.getRmProject().getId(), rmSource.getResourcePath(), rmTarget.getResourcePath());
        } catch (DBException e) {
            throw new IOException("Failed to move rm resource:  " + e.getMessage(), e);
        }
    }

    @Override
    public boolean isSameFile(Path path, Path path2) throws IOException {
        return path.toString().equals(path2.toString());
    }

    @Override
    public boolean isHidden(Path path) throws IOException {
        //rm does not support hidden files
        return false;
    }

    @Override
    public FileStore getFileStore(Path path) throws IOException {
        return ((RMPath) path).getFileStore();
    }

    @Override
    public void checkAccess(Path path, AccessMode... modes) throws IOException {

    }

    @Override
    public <V extends FileAttributeView> V getFileAttributeView(Path path, Class<V> type, LinkOption... options) {
        return null;
    }

    @Override
    public <A extends BasicFileAttributes> A readAttributes(Path path, Class<A> type, LinkOption... options) throws IOException {
        if (type == BasicFileAttributes.class) {
            RMPath rmPath = (RMPath) path;
            if (!rmPath.isProject()) {
                return type.cast(new RMProjectBasicAttribute(rmPath.getRmProject()));
            } else {
                return type.cast(new RMResourceBasicAttribute(rmPath.getRmResource()));
            }
        }
        return null;
    }
}

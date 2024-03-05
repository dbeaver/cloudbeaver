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
package io.cloudbeaver.service.rm.nio;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.nio.NIOFileSystemProvider;
import org.jkiss.dbeaver.model.nio.NIOUtils;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.rm.RMUtils;
import org.jkiss.utils.CommonUtils;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.FileAttribute;
import java.nio.file.attribute.FileAttributeView;
import java.util.Arrays;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

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
    public FileSystem newFileSystem(URI uri, Map<String, ?> env) {
        return getFileSystem(uri);
    }

    @Override
    public FileSystem getFileSystem(URI uri) {
        validateUri(uri);
        String projectId = uri.getAuthority();
        if (CommonUtils.isEmpty(projectId)) {
            projectId = null;
        }
        try {
            return new RMNIOFileSystem(projectId, this);
        } catch (Exception e) {
            throw new FileSystemNotFoundException("RM file system not found: " + e.getMessage());
        }
    }

    @Override
    public Path getPath(URI uri) {
        validateUri(uri);
        String projectId = uri.getAuthority();
        if (CommonUtils.isEmpty(projectId)) {
            projectId = null;
        }
        RMNIOFileSystem rmNioFileSystem = new RMNIOFileSystem(projectId, this);
        String resourcePath = uri.getPath();
        resourcePath = URLDecoder.decode(resourcePath, StandardCharsets.UTF_8);
        if (CommonUtils.isNotEmpty(resourcePath) && projectId == null) {
            throw new IllegalArgumentException("Project is not specified in URI");
        }
        if (CommonUtils.isEmpty(resourcePath)) {
            return new RMPath(rmNioFileSystem);
        } else {
            return new RMPath(rmNioFileSystem, resourcePath);
        }
    }

    @Override
    public RMByteArrayChannel newByteChannel(Path path, Set<? extends OpenOption> options, FileAttribute<?>... attrs)
        throws IOException {
        RMPath rmPath = (RMPath) path;
        if (Files.isDirectory(rmPath)) {
            throw new IllegalArgumentException("Cannot open channel for a folder");
        }

        try {
            if (Files.exists(path)) {
                byte[] data = rmController.getResourceContents(rmPath.getRmProjectId(), rmPath.getResourcePath());
                return new RMByteArrayChannel(data, rmPath, options);
            } else {
                return new RMByteArrayChannel(new byte[0], rmPath, options);
            }
        } catch (DBException e) {
            throw new IOException("Failed to read resource: " + e.getMessage(), e);
        }
    }

    @Override
    public OutputStream newOutputStream(Path path, OpenOption... options) throws IOException {
        return new RMOutputStream((RMPath) path);
    }

    @Override
    public DirectoryStream<Path> newDirectoryStream(Path dir, DirectoryStream.Filter<? super Path> filter)
        throws IOException {
        RMPath rmDir = (RMPath) dir;
        String rmDirPath = rmDir.getResourcePath();
        String separator = rmDir.getFileSystem().getSeparator();

        return new DirectoryStream<>() {
            @Override
            public Iterator<Path> iterator() {
                var rmController = rmDir.getFileSystem().getRmController();
                try {
                    if (rmDir.isRmRootPath()) {
                        return Arrays.stream(rmController.listAccessibleProjects())
                            .map(rmProject -> (Path) new RMPath(
                                    new RMNIOFileSystem(
                                        rmProject.getId(),
                                        RMNIOFileSystemProvider.this
                                    )
                                )
                            ).iterator();
                    } else {
                        var resources = rmController.listResources(
                            rmDir.getRmProjectId(),
                            rmDirPath,
                            null,
                            false,
                            false,
                            false
                        );
                        return Arrays.stream(resources)
                            .map(rmResource -> (Path) new RMPath(rmDir.getFileSystem(),
                                NIOUtils.resolve(separator, rmDirPath, rmResource.getName())
                            ))
                            .iterator();
                    }
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
            if (rmDir.isRmRootPath()) {
                return;
            }
            if (rmDir.isProjectPath()) {
                rmController.createProject(RMUtils.getProjectName(rmDir.getRmProjectId()), null);
            } else {
                rmController.createResource(rmDir.getRmProjectId(), rmDir.getResourcePath(), true);
            }
        } catch (DBException e) {
            throw new IOException("Failed to create directory: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(Path path) throws IOException {
        RMPath rmPath = (RMPath) path;
        if (rmPath.isRmRootPath()) {
            throw new IOException("Cannot delete root rm dir:" + path);
        }
        try {
            String rmProjectId = rmPath.getRmProjectId();
            var rmController = rmPath.getFileSystem().getRmController();
            if (rmPath.isProjectPath()) {
                rmController.deleteProject(rmProjectId);
            } else {
                rmController.deleteResource(rmProjectId, rmPath.getResourcePath(), true);
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
            rmController.moveResource(rmSource.getRmProjectId(),
                rmSource.getResourcePath(),
                rmTarget.getResourcePath());
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
        RMPath rmPath = (RMPath) path;
        if (rmPath.isRmRootPath()) {
            throw new IllegalArgumentException("Cannot create file store for path: " + path);
        }
        return new RMNIOProjectFileStore(rmPath.getFileSystem().getRmProject());
    }

    @Override
    public void checkAccess(Path path, AccessMode... modes) throws IOException {
        RMPath rmPath = (RMPath) path;
        try {
            if (rmPath.isRmRootPath()) {
                return;
            }
            if (rmPath.isProjectPath()) {
                if (rmController.getProject(rmPath.getRmProjectId(), false, false) == null) {
                    // we should throw error, otherwise Files.exists return true
                    throw new FileNotFoundException("Project not found: " + rmPath.getRmProjectId());
                }
            } else if (rmController.getResource(rmPath.getRmProjectId(), rmPath.getResourcePath()) == null) {
                // some here
                throw new FileNotFoundException("Resource not found: " + rmPath.getResourcePath());
            }
        } catch (Exception e) {
            throw new IOException("Failed to check path access: " + e.getMessage(), e);
        }
    }

    @Override
    public <V extends FileAttributeView> V getFileAttributeView(Path path, Class<V> type, LinkOption... options) {
        return null;
    }

    @Override
    public <A extends BasicFileAttributes> A readAttributes(Path path, Class<A> type, LinkOption... options) throws IOException {
        if (type == BasicFileAttributes.class) {
            RMPath rmPath = (RMPath) path;
            try {
                if (rmPath.isRmRootPath()) {
                    return type.cast(new RMRootBasicAttribute());
                }
                if (rmPath.isProjectPath()) {
                    boolean projectExist = rmController.getProject(rmPath.getRmProjectId(), false, false) != null;
                    if (!projectExist) {
                        throw new FileNotFoundException();
                    }
                    return type.cast(new RMRootBasicAttribute());
                } else {
                    RMResource rmResource = rmController.getResource(rmPath.getRmProjectId(), rmPath.getResourcePath());
                    if (rmResource == null) {
                        throw new FileNotFoundException();
                    }
                    return type.cast(new RMResourceBasicAttribute(rmResource));
                }
            } catch (DBException e) {
                throw new IOException("Failed to read resource attribute: " + e.getMessage(), e);
            }
        }
        return null;
    }

    @NotNull
    public RMController getRmController() {
        return rmController;
    }
}

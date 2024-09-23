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
package io.cloudbeaver.model.app;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.registry.fs.FileSystemProviderRegistry;

import java.net.URI;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Path;

/**
 * Abstract class that contains methods for loading configuration with gson.
 */
public abstract class BaseServerConfigurationController<T extends WebServerConfiguration>
    implements WebServerConfigurationController<T> {
    private static final Log log = Log.getLog(BaseServerConfigurationController.class);
    @NotNull
    private final Path homeDirectory;

    private Path workspacePath;

    protected BaseServerConfigurationController(@NotNull Path homeDirectory) {
        this.homeDirectory = homeDirectory;
    }

    @NotNull
    public Gson getGson() {
        return getGsonBuilder().create();
    }

    protected abstract GsonBuilder getGsonBuilder();

    public abstract T getServerConfiguration();


    @NotNull
    protected synchronized Path initWorkspacePath() throws DBException {
        if (workspacePath != null) {
            log.warn("Workspace directory already initialized: " + workspacePath);
            return workspacePath;
        }
        String workspaceLocation = getServerConfiguration().getWorkspaceLocation();
        URI workspaceUri = URI.create(workspaceLocation);
        if (workspaceUri.getScheme() == null) {
            // default filesystem
            return getHomeDirectory().resolve(workspaceLocation);
        }

        var externalFsProvider =
            FileSystemProviderRegistry.getInstance().getFileSystemProviderBySchema(workspaceUri.getScheme());
        if (externalFsProvider == null) {
            throw new DBException("File system not found for scheme: " + workspaceUri.getScheme());
        }
        ClassLoader fsClassloader = externalFsProvider.getInstance().getClass().getClassLoader();
        try (FileSystem externalFileSystem = FileSystems.newFileSystem(workspaceUri, System.getenv(), fsClassloader);) {
            this.workspacePath = externalFileSystem.provider().getPath(workspaceUri);
            return workspacePath;
        } catch (Exception e) {
            throw new DBException("Failed to initialize workspace path: " + workspaceUri, e);
        }
    }

    @NotNull
    protected Path getHomeDirectory() {
        return homeDirectory;
    }

    @NotNull
    @Override
    public Path getWorkspacePath() {
        if (workspacePath == null) {
            throw new RuntimeException("Workspace path not initialized");
        }
        return workspacePath;
    }
}

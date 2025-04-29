/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
import com.google.gson.Strictness;
import io.cloudbeaver.server.CBConstants;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.registry.fs.FileSystemProviderRegistry;
import org.jkiss.dbeaver.utils.ContentUtils;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

/**
 * Abstract class that contains methods for loading configuration with gson.
 */
public abstract class BaseServerConfigurationController<T extends ServletServerConfiguration>
    implements ServletServerConfigurationController<T> {
    private static final Log log = Log.getLog(BaseServerConfigurationController.class);
    @NotNull
    private final Path homeDirectory;

    @NotNull
    protected final Path workspacePath;

    protected BaseServerConfigurationController(@NotNull Path homeDirectory) {
        this.homeDirectory = homeDirectory;
        this.workspacePath = initWorkspacePath();
        log.debug("Workspace path initialized: " + workspacePath.toAbsolutePath());
    }

    @NotNull
    public Gson getGson() {
        return getGsonBuilder().create();
    }

    @NotNull
    protected abstract GsonBuilder getGsonBuilder();

    public abstract T getServerConfiguration();


    @NotNull
    protected synchronized Path initWorkspacePath() {
        Path defaultWorkspaceLocation = homeDirectory.resolve("workspace");
        String workspaceLocation = getWorkspaceLocationFromEnv();
        if (CommonUtils.isEmpty(workspaceLocation)) {
            return defaultWorkspaceLocation;
        }
        URI workspaceUri = URI.create(workspaceLocation);
        if (workspaceUri.getScheme() == null) {
            // default filesystem
            return getHomeDirectory().resolve(workspaceLocation);
        } else {
            var externalFsProvider =
                FileSystemProviderRegistry.getInstance().getFileSystemProviderBySchema(workspaceUri.getScheme());
            if (externalFsProvider == null) {
                log.error("File system not found for scheme: " + workspaceUri.getScheme() + " default workspace " +
                    "location will be used");
                return defaultWorkspaceLocation;
            }
            ClassLoader fsClassloader = externalFsProvider.getInstance().getClass().getClassLoader();
            try (FileSystem externalFileSystem = FileSystems.newFileSystem(workspaceUri,
                System.getenv(),
                fsClassloader)) {
                log.info("Path from external filesystem used for workspace: " + workspaceUri);
                return externalFileSystem.provider().getPath(workspaceUri);
            } catch (Exception e) {
                log.error("Failed to initialize workspace path: " + workspaceUri + " default workspace " +
                    "location will be used", e);
            }
        }
        return defaultWorkspaceLocation;
    }

    @Nullable
    protected abstract String getWorkspaceLocationFromEnv();

    @NotNull
    protected Path getHomeDirectory() {
        return homeDirectory;
    }

    @NotNull
    @Override
    public Path getWorkspacePath() {
        return workspacePath;
    }

    @NotNull
    protected Path getDataDirectory(boolean create) {
        Path dataDir = getWorkspacePath().resolve(CBConstants.RUNTIME_DATA_DIR_NAME);
        if (create && !Files.exists(dataDir)) {
            try {
                Files.createDirectories(dataDir);
            } catch (Exception e) {
                log.error("Can't create data directory '" + dataDir.toAbsolutePath() + "'");
            }
        }
        return dataDir;
    }

    protected synchronized void writeConfig(Path configPath, Map<String, Object> configurationProperties)
    throws DBException {
        if (Files.exists(configPath)) {
            ContentUtils.makeFileBackup(configPath);
        }

        try (Writer out = new OutputStreamWriter(Files.newOutputStream(configPath), StandardCharsets.UTF_8)) {
            Gson gson = new GsonBuilder()
                .setStrictness(Strictness.LENIENT)
                .setPrettyPrinting()
                .create();
            gson.toJson(configurationProperties, out);

        } catch (IOException e) {
            throw new DBException("Error writing runtime configuration", e);
        }
    }
}

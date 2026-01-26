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
package io.cloudbeaver.model.rm.local;

import com.google.gson.reflect.TypeToken;
import io.cloudbeaver.utils.ServletAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.fs.lock.FileLockController;
import org.jkiss.dbeaver.model.impl.app.BaseProjectImpl;
import org.jkiss.dbeaver.model.rm.RMProjectInfo;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.rm.RMUtils;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Stream;

public class ProjectsMetadataInfo {
    private static final Log log = Log.getLog(ProjectsMetadataInfo.class);
    private static final String PROJECTS_INFO_FILE_NAME = "projects-info.json";

    private final Map<String, RMProjectInfo> projectsInfo = new LinkedHashMap<>();
    private final Path projectsPath;
    private final FileLockController lockController;


    public ProjectsMetadataInfo(@NotNull Path projectsPath) throws DBException {
        this.projectsPath = projectsPath;
        this.lockController = new FileLockController(ServletAppUtils.getServletApplication().getApplicationInstanceId());
        readProjectInfos(projectsPath);
    }

    public RMProjectInfo getProjectInfo(@NotNull String projectId) {
        return projectsInfo.computeIfAbsent(projectId, key -> new RMProjectInfo());
    }

    public void updateProjectInfo(@NotNull String projectId, @Nullable RMProjectInfo projectInfo) {
        if (projectInfo != null) {
            projectsInfo.put(projectId, projectInfo);
        } else {
            projectsInfo.remove(projectId);
        }
        saveProjectsInfo();
    }

    private void readProjectInfos(@NotNull Path path) {
        if (!Files.exists(path)) {
            return;
        }
        Path projectInfoFile = path.resolve(PROJECTS_INFO_FILE_NAME);
        if (!Files.exists(projectInfoFile)) {
            loadAndMigrateProjectDataToCommonFile(path);
            saveProjectsInfo();
            return;
        }
        readProjectInfosFromFile(projectInfoFile);
    }

    private void readProjectInfosFromFile(@NotNull Path projectInfoFile) {
        try {
            log.info("Reading project metadata information");
            String content = Files.readString(projectInfoFile, StandardCharsets.UTF_8);
            Map<String, RMProjectInfo> loaded = JSONUtils.GSON.fromJson(
                content,
                TypeToken.getParameterized(Map.class, String.class, RMProjectInfo.class).getType()
            );
            projectsInfo.clear();
            if (loaded != null) {
                projectsInfo.putAll(loaded);
            }
        } catch (IOException e) {
            log.error("Error reading existing " + PROJECTS_INFO_FILE_NAME, e);
        }
    }

    private void loadAndMigrateProjectDataToCommonFile(@NotNull Path path) {
        log.info("Migrating shared project information to the common place");
        Map<String, RMProjectInfo> infos = new LinkedHashMap<>();
        try (Stream<Path> stream = Files.list(path)) {
            stream.filter(Files::isDirectory).forEach(projectDir -> {
                RMProjectInfo info = getProjectInfoFromProjectSettings(projectDir);
                String projectId = RMUtils.makeProjectIdFromPath(projectDir, RMProjectType.SHARED);
                infos.put(projectId, info);
            });
        } catch (IOException e) {
            log.error("Error listing shared projects path", e);
        }
        log.info("Migration for project information completed");
        projectsInfo.clear();
        projectsInfo.putAll(infos);
    }

    @NotNull
    private RMProjectInfo getProjectInfoFromProjectSettings(@NotNull Path projectPath) {
        String name = null;
        String description = null;

        Path settings = projectPath.resolve(DBPProject.METADATA_FOLDER).resolve(BaseProjectImpl.SETTINGS_STORAGE_FILE);
        if (Files.exists(settings) && Files.isRegularFile(settings)) {
            try {
                String json = Files.readString(settings, StandardCharsets.UTF_8);
                Map<String, Object> map = JSONUtils.GSON.fromJson(json, JSONUtils.MAP_TYPE_TOKEN);
                name = JSONUtils.getString(map, BaseProjectImpl.PROP_PROJECT_NAME);
                description = JSONUtils.getString(map, BaseProjectImpl.PROP_PROJECT_DESCRIPTION);
            } catch (IOException e) {
                log.warn("Failed to read project settings for " + projectPath + ": " + e.getMessage());
            } catch (Exception e) {
                log.warn("Failed to parse project settings for " + projectPath + ": " + e.getMessage());
            }
        }
        RMProjectInfo info = new RMProjectInfo();
        info.setName(CommonUtils.isEmpty(name) ? projectPath.getFileName().toString() : name);
        info.setDescription(description);
        return info;
    }

    private void saveProjectsInfo() {
        try (var lock = lockController.lock(PROJECTS_INFO_FILE_NAME, "saveProjectsInfo")) {
            log.info("Saving project information");
            Files.writeString(projectsPath.resolve(PROJECTS_INFO_FILE_NAME), JSONUtils.GSON.toJson(projectsInfo));
        } catch (IOException e) {
            log.error("Error writing " + PROJECTS_INFO_FILE_NAME, e);
        } catch (DBException e) {
            log.error("Error locking file " + PROJECTS_INFO_FILE_NAME + ": " + e.getMessage());
        }
    }
}
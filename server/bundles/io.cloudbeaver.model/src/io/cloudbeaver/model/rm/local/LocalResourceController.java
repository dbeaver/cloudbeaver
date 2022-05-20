/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.service.sql.WebSQLConstants;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMCredentials;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.exec.DBCFeatureNotSupportedException;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.rm.RMResourceChange;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Resource manager API
 */
public class LocalResourceController implements RMController {

    private static final Log log = Log.getLog(LocalResourceController.class);

    private static final String PROJECT_PREFIX_GLOBAL = "g_";
    private static final String PROJECT_PREFIX_SHARED = "s_";
    private static final String PROJECT_PREFIX_USER = "u_";
    public static final String DEFAULT_CHANGE_ID = "0";

    private final SMCredentialsProvider credentialsProvider;

    private final Path rootPath;
    private final Path userProjectsPath;
    private final Path sharedProjectsPath;
    private final String globalProjectName;

    public LocalResourceController(
        SMCredentialsProvider credentialsProvider,
        Path rootPath,
        Path userProjectsPath,
        Path sharedProjectsPath) {
        this.credentialsProvider = credentialsProvider;
        this.rootPath = rootPath;
        this.userProjectsPath = userProjectsPath;
        this.sharedProjectsPath = sharedProjectsPath;

        this.globalProjectName = DBWorkbench.getPlatform().getApplication().getDefaultProjectName();
    }

    private Path getGlobalProjectPath() {
        return this.rootPath.resolve(this.globalProjectName);
    }

    private Path getPrivateProjectPath() {
        SMCredentials activeUserCredentials = credentialsProvider.getActiveUserCredentials();
        String userId = activeUserCredentials == null ? null : activeUserCredentials.getUserId();
        return userId == null ? null : this.userProjectsPath.resolve(userId);
    }

    @NotNull
    @Override
    public RMProject[] listAccessibleProjects() throws DBException {
        try {
            List<RMProject> projects;
            if (Files.exists(sharedProjectsPath)) {
                projects = Files.list(sharedProjectsPath)
                    .map((Path path) -> makeProjectFromPath(path, PROJECT_PREFIX_SHARED, true))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            } else {
                projects = new ArrayList<>();
            }
            RMProject globalProject = makeProjectFromPath(getGlobalProjectPath(), PROJECT_PREFIX_GLOBAL, true);
            if (globalProject != null) {
                projects.add(globalProject);
            }
            RMProject userProject = makeProjectFromPath(getPrivateProjectPath(), PROJECT_PREFIX_USER, false);
            if (userProject != null) {
                projects.add(0, userProject);
            }
            return projects.toArray(new RMProject[0]);
        } catch (IOException e) {
            throw new DBException("Error reading projects", e);
        }
    }

    @NotNull
    @Override
    public RMProject[] listSharedProjects() throws DBException {
        try {
            if (!Files.exists(sharedProjectsPath)) {
                return new RMProject[0];
            }
            return Files.list(sharedProjectsPath)
                .map((Path path) -> makeProjectFromPath(path, PROJECT_PREFIX_SHARED, false))
                .filter(Objects::nonNull)
                .toArray(RMProject[]::new);
        } catch (IOException e) {
            throw new DBException("Error reading shared projects", e);
        }
    }

    @Override
    public void createProject(@NotNull RMProject project) throws DBException {
        throw new DBCFeatureNotSupportedException();
    }

    @Override
    public void deleteProject(@NotNull String projectId) throws DBException {
        throw new DBCFeatureNotSupportedException();
    }

    @NotNull
    @Override
    public RMResource[] listResources(
        @NotNull String projectId,
        @Nullable String folder,
        @Nullable String nameMask,
        boolean readProperties,
        boolean readHistory) throws DBException
    {
        Path projectPath = getProjectPath(projectId);
        try {
            if (!Files.exists(projectPath)) {
                return new RMResource[0];
            }
            Path folderPath = CommonUtils.isEmpty(folder) ?
                projectPath :
                projectPath.resolve(folder);
            folderPath = folderPath.normalize();
            // Test that folder is inside the project
            if (!folderPath.startsWith(projectPath)) {
                throw new DBException("Invalid folder path");
            }
            return Files.list(folderPath)
                .filter(path -> !path.getFileName().toString().startsWith(".")) // skip hidden files
                .map((Path path) -> makeResourceFromPath(path, readProperties, readHistory))
                .filter(Objects::nonNull)
                .toArray(RMResource[]::new);
        } catch (NoSuchFileException e) {
            throw new DBException("Invalid resource folder " + folder);
        } catch (IOException e) {
            throw new DBException("Error reading resources", e);
        }
    }

    @Override
    public String createResource(
        @NotNull String projectId,
        @NotNull String resourcePath,
        boolean isFolder) throws DBException
    {
        Path targetPath = getTargetPath(projectId, resourcePath);
        if (Files.exists(targetPath)) {
            throw new DBException("Resource '" + resourcePath + "' already exists");
        }
        try {
            if (isFolder) {
                Files.createDirectory(targetPath);
            } else {
                Files.createFile(targetPath);
            }
        } catch (IOException e) {
            throw new DBException("Error creating resource '" + resourcePath + "'", e);
        }
        return DEFAULT_CHANGE_ID;
    }

    @Override
    public String moveResource(@NotNull String projectId, @NotNull String oldResourcePath, @NotNull String newResourcePath) throws DBException {
        throw new DBCFeatureNotSupportedException();
    }

    @Override
    public void deleteResource(@NotNull String projectId, @NotNull String resourcePath, boolean recursive) throws DBException {
        Path targetPath = getTargetPath(projectId, resourcePath);
        if (!Files.exists(targetPath)) {
            throw new DBException("Resource '" + resourcePath + "' doesn't exists");
        }
        try {
            Files.delete(targetPath);
        } catch (IOException e) {
            throw new DBException("Error deleting resource '" + resourcePath + "'", e);
        }
    }

    @NotNull
    @Override
    public byte[] getResourceContents(@NotNull String projectId, @NotNull String resourcePath) throws DBException {
        Path targetPath = getTargetPath(projectId, resourcePath);
        if (!Files.exists(targetPath)) {
            throw new DBException("Resource '" + resourcePath + "' doesn't exists");
        }
        try {
            return Files.readAllBytes(targetPath);
        } catch (IOException e) {
            throw new DBException("Error reading resource '" + resourcePath + "'", e);
        }
    }

    @NotNull
    @Override
    public String setResourceContents(
        @NotNull String projectId,
        @NotNull String resourcePath,
        @NotNull byte[] data) throws DBException
    {
        Number fileSizeLimit = WebAppUtils.getWebApplication()
                .getAppConfiguration()
                .getResourceQuota(WebSQLConstants.QUOTA_PROP_RM_FILE_SIZE_LIMIT);
        if (fileSizeLimit != null && data.length > fileSizeLimit.longValue()) {
            throw new DBQuotaException(
                    "File size quota exceeded",
                    WebSQLConstants.QUOTA_PROP_RM_FILE_SIZE_LIMIT,
                    fileSizeLimit.longValue(),
                    data.length);
        }
        Path targetPath = getTargetPath(projectId, resourcePath);
        if (!Files.exists(targetPath)) {
            throw new DBException("Resource '" + resourcePath + "' doesn't exists");
        }
        try {
            Files.write(targetPath, data);
        } catch (IOException e) {
            throw new DBException("Error reading resource '" + resourcePath + "'", e);
        }

        return DEFAULT_CHANGE_ID;
    }

    @NotNull
    private Path getTargetPath(@NotNull String projectId, @NotNull String resourcePath) throws DBException {
        Path projectPath = getProjectPath(projectId);
        if (!Files.exists(projectPath)) {
            try {
                Files.createDirectories(projectPath);
            } catch (IOException e) {
                throw new DBException("Error creating project path", e);
            }
        }
        Path targetPath = projectPath.resolve(resourcePath).normalize();
        if (!targetPath.startsWith(projectPath)) {
            throw new DBException("Invalid resource path");
        }
        return targetPath;
    }

    private RMProject makeProjectFromPath(Path path, String prefix, boolean checkExistence) {
        if (path == null) {
            return null;
        }
        if (Files.exists(path)) {
            if (!Files.isDirectory(path)) {
                log.error("Project path " + path + " is not a directory");
                return null;
            }
        } else if (checkExistence) {
            return null;
        }

        RMProject project = new RMProject();
        project.setName(path.getFileName().toString());
        project.setId(prefix + project.getName());
        project.setShared(prefix.equals(PROJECT_PREFIX_SHARED) || prefix.equals(PROJECT_PREFIX_GLOBAL));
        try {
            project.setCreateTime(
                OffsetDateTime.ofInstant(Files.getLastModifiedTime(path).toInstant(), ZoneId.of("UTC")));
        } catch (IOException e) {
            log.error(e);
        }

        return project;
    }


    private Path getProjectPath(String projectId) throws DBException {
        RMResourceName resourceName = parseResourceName(projectId);
        String prefix = resourceName.getPrefix();
        String projectName = resourceName.getProjectName();
        switch (prefix) {
            case PROJECT_PREFIX_GLOBAL:
                if (!projectName.equals(globalProjectName)) {
                    throw new DBException("Invalid global project name '" + projectName + "'");
                }
                return getGlobalProjectPath();
            case PROJECT_PREFIX_SHARED:
                return sharedProjectsPath.resolve(projectName);
            default:
                var activeUserCredentials = credentialsProvider.getActiveUserCredentials();
                var userId = activeUserCredentials == null ? null : activeUserCredentials.getUserId();
                if (!projectName.equals(userId)) {
                    throw new DBException("No access to the project: " + projectName);
                }
                return userProjectsPath.resolve(projectName);
        }
    }

    private RMResource makeResourceFromPath(Path path, boolean readProperties, boolean readHistory) {
        if (path == null || !Files.exists(path)) {
            return null;
        }
        RMResource resource = new RMResource();
        resource.setName(path.getFileName().toString());
        resource.setFolder(Files.isDirectory(path));
        try {
            if (!resource.isFolder()) {
                resource.setLength(Files.size(path));
            }
            if (readHistory) {
                resource.setChanges(
                    Collections.singletonList(
                        new RMResourceChange(
                            DEFAULT_CHANGE_ID,
                            new Date(Files.getLastModifiedTime(path).toMillis()),
                            null
                        ))
                );
            }
        } catch (IOException e) {
            log.error(e);
        }

        return resource;
    }

    public static Builder builder(SMCredentialsProvider credentialsProvider) {
        return new Builder(credentialsProvider);
    }

    public static final class Builder {
        private final SMCredentialsProvider credentialsProvider;

        private Path rootPath;
        private Path userProjectsPath;
        private Path sharedProjectsPath;

        private Builder(SMCredentialsProvider credentialsProvider) {
            this.credentialsProvider = credentialsProvider;
            this.rootPath = DBWorkbench.getPlatform().getWorkspace().getAbsolutePath();
            this.userProjectsPath = this.rootPath.resolve(DBWConstants.USER_PROJECTS_FOLDER);
            this.sharedProjectsPath = this.rootPath.resolve(DBWConstants.SHARED_PROJECTS_FOLDER);
        }

        public Builder setRootPath(Path rootPath) {
            this.rootPath = rootPath;
            return this;
        }

        public Builder setUserProjectsPath(Path userProjectsPath) {
            this.userProjectsPath = userProjectsPath;
            return this;
        }

        public Builder setSharedProjectsPath(Path sharedProjectsPath) {
            this.sharedProjectsPath = sharedProjectsPath;
            return this;
        }

        public LocalResourceController build() {
            return new LocalResourceController(credentialsProvider, rootPath, userProjectsPath, sharedProjectsPath);
        }
    }

    public static class RMResourceName {
        String prefix;
        String projectName;
        private RMResourceName(String prefix, String projectName) {
            this.prefix = prefix;
            this.projectName = projectName;
        }

        public String getPrefix() {
            return prefix;
        }

        public String getProjectName() {
            return projectName;
        }
    }
    public static RMResourceName parseResourceName(String projectId) {
        String prefix;
        String projectName;
        int divPos = projectId.indexOf("_");
        if (divPos < 0) {
            prefix = PROJECT_PREFIX_USER;
            projectName = projectId;
        } else {
            prefix = projectId.substring(0, divPos + 1);
            projectName = projectId.substring(divPos + 1);
        }
        return new RMResourceName(prefix, projectName);
    }

    public static boolean isUserProject(String projectId) {
        return PROJECT_PREFIX_USER.equals(parseResourceName(projectId).getPrefix());
    }

}

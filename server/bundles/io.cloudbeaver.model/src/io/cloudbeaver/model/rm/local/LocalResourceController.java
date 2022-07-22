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

import io.cloudbeaver.VirtualProjectImpl;
import io.cloudbeaver.model.rm.RMUtils;
import io.cloudbeaver.service.sql.WebSQLConstants;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceConfigurationStorage;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.SMCredentials;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.impl.auth.SessionContextImpl;
import org.jkiss.dbeaver.model.rm.*;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.registry.*;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Resource manager API
 */
public class LocalResourceController implements RMController {

    private static final Log log = Log.getLog(LocalResourceController.class);

    private static final String FILE_REGEX = "(?U)[\\w.$()@/\\\\ -]+";

    public static final String DEFAULT_CHANGE_ID = "0";

    private final SMCredentialsProvider credentialsProvider;

    private final Path rootPath;
    private final Path userProjectsPath;
    private final Path sharedProjectsPath;
    private final String globalProjectName;

    private final Map<String, VirtualProjectImpl> projectRegistries = new LinkedHashMap<>();

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

    private DBPProject getProjectMetadata(String projectId) throws DBException {
        synchronized (projectRegistries) {
            VirtualProjectImpl project = projectRegistries.get(projectId);
            if (project == null) {
                SessionContextImpl sessionContext = new SessionContextImpl(null);
                RMProject rmProject = makeProjectFromId(projectId);
                project = new VirtualProjectImpl(
                    rmProject,
                    sessionContext);
                projectRegistries.put(projectId, project);
            }
            return project;
        }
    }

    @NotNull
    @Override
    public RMProject[] listAccessibleProjects() throws DBException {
        try {
            List<RMProject> projects;
            if (Files.exists(sharedProjectsPath)) {
                projects = Files.list(sharedProjectsPath)
                    .map((Path path) -> makeProjectFromPath(path, RMProject.Type.SHARED, true))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            } else {
                projects = new ArrayList<>();
            }
            RMProject globalProject = makeProjectFromPath(getGlobalProjectPath(), RMProject.Type.GLOBAL, true);
            if (globalProject != null) {
                projects.add(globalProject);
            }
            RMProject userProject = makeProjectFromPath(getPrivateProjectPath(), RMProject.Type.USER, false);
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
                .map((Path path) -> makeProjectFromPath(path, RMProject.Type.SHARED, false))
                .filter(Objects::nonNull)
                .toArray(RMProject[]::new);
        } catch (IOException e) {
            throw new DBException("Error reading shared projects", e);
        }
    }

    @Override
    public RMProject createProject(@NotNull String name, @Nullable String description) throws DBException {
        if (!Files.exists(sharedProjectsPath)) {
            try {
                Files.createDirectory(sharedProjectsPath);
            } catch (IOException e) {
                throw new DBException("Error creating shared project path", e);
            }
        }
        validateResourcePath(name);
        RMProject project;
        project = makeProjectFromPath(sharedProjectsPath.resolve(name),
            RMProject.Type.SHARED, false);
        if (project == null) {
            throw new DBException("Project '" + name + "' already exists");
        }
        try {
            Files.createDirectory(getProjectPath(project.getId()));
            return project;
        } catch (IOException e) {
            throw new DBException("Error creating project path", e);
        }
    }

    @Override
    public void deleteProject(@NotNull String projectId) throws DBException {
        RMProject project = makeProjectFromId(projectId);
        Path targetPath = getProjectPath(projectId);
        if (!Files.exists(targetPath)) {
            throw new DBException("Project '" + project.getName() + "' doesn't exists");
        }
        try {
            CommonUtils.deleteDirectory(targetPath);
        } catch (IOException e) {
            throw new DBException("Error deleting project '" + project.getName() + "'", e);
        }
    }

    @Override
    public RMProject getProject(@NotNull String projectId, boolean readResources) throws DBException {
        RMProject project = makeProjectFromId(projectId);
        if (readResources) {
            project.setChildren(
                listResources(projectId, null, null, true, false, true)
            );
        }
        return project;
    }

    @Override
    public Object getProjectProperty(@NotNull String projectId, @NotNull String propName) throws DBException {
        DBPProject project = getProjectMetadata(projectId);
        return project.getProjectProperty(propName);
    }

    @Override
    public String getProjectsDataSources(@NotNull String projectId) throws DBException {
        DBPProject projectMetadata = getProjectMetadata(projectId);
        DBPDataSourceRegistry registry = projectMetadata.getDataSourceRegistry();
        DataSourceConfigurationManagerBuffer buffer = new DataSourceConfigurationManagerBuffer();
        ((DataSourceRegistry)registry).saveConfigurationToManager(new VoidProgressMonitor(), buffer, null);

        return new String(buffer.getData(), StandardCharsets.UTF_8);
    }

    @Override
    public void saveProjectDataSources(@NotNull String projectId, @NotNull String configuration) throws DBException {
        final DBPProject project = getProjectMetadata(projectId);
        final DataSourceRegistry registry = (DataSourceRegistry) project.getDataSourceRegistry();
        final DBPDataSourceConfigurationStorage storage = new DataSourceMemoryStorage(configuration.getBytes(StandardCharsets.UTF_8));
        final DataSourceConfigurationManager manager = new DataSourceConfigurationManagerBuffer();
        registry.loadDataSources(List.of(storage), manager, true, false);
        registry.saveDataSources();
    }

    @Override
    public void deleteProjectDataSources(@NotNull String projectId, @NotNull String[] dataSourceIds) throws DBException {
        final DBPProject project = getProjectMetadata(projectId);
        final DataSourceRegistry registry = (DataSourceRegistry) project.getDataSourceRegistry();

        for (String dataSourceId : dataSourceIds) {
            final DataSourceDescriptor dataSource = registry.getDataSource(dataSourceId);

            if (dataSource != null) {
                registry.removeDataSource(dataSource);
            } else {
                log.warn("Could not find datasource " + dataSourceId + " for deletion");
            }
        }
    }

    @NotNull
    @Override
    public RMResource[] listResources(
        @NotNull String projectId,
        @Nullable String folder,
        @Nullable String nameMask,
        boolean readProperties,
        boolean readHistory,
        boolean recursive) throws DBException
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
            return readChildResources(folderPath, readProperties, readHistory, recursive);
        } catch (NoSuchFileException e) {
            throw new DBException("Invalid resource folder " + folder);
        } catch (IOException e) {
            throw new DBException("Error reading resources", e);
        }
    }

    @NotNull
    private RMResource[] readChildResources(Path folderPath, boolean readProperties, boolean readHistory, boolean recursive) throws IOException {
        try (Stream<Path> files = Files.list(folderPath)) {
            return files.filter(path -> !path.getFileName().toString().startsWith(".")) // skip hidden files
                .map((Path path) -> makeResourceFromPath(path, readProperties, readHistory, recursive))
                .filter(Objects::nonNull)
                .toArray(RMResource[]::new);
        }
    }

    @Override
    public String createResource(
        @NotNull String projectId,
        @NotNull String resourcePath,
        boolean isFolder) throws DBException
    {
        validateResourcePath(resourcePath);
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
    public String moveResource(
        @NotNull String projectId,
        @NotNull String oldResourcePath,
        @NotNull String newResourcePath
    ) throws DBException {
        Path oldTargetPath = getTargetPath(projectId, oldResourcePath);
        if (!Files.exists(oldTargetPath)) {
            throw new DBException("Resource '" + oldTargetPath + "' doesn't exists");
        }
        Path newTargetPath = getTargetPath(projectId, newResourcePath);
        validateResourcePath(newTargetPath.toString());
        try {
            Files.move(oldTargetPath, newTargetPath);
        } catch (IOException e) {
            throw new DBException("Error moving resource '" + oldResourcePath + "'", e);
        }
        return DEFAULT_CHANGE_ID;
    }

    @Override
    public void deleteResource(@NotNull String projectId, @NotNull String resourcePath, boolean recursive) throws DBException {
        validateResourcePath(resourcePath);
        Path targetPath = getTargetPath(projectId, resourcePath);
        if (!Files.exists(targetPath)) {
            throw new DBException("Resource '" + resourcePath + "' doesn't exists");
        }
        List<RMResource> rmResourcePath = makeResourcePath(projectId, targetPath, recursive);
        try {
            if (targetPath.toFile().isDirectory()) {
                CommonUtils.deleteDirectory(targetPath);
            } else {
                Files.delete(targetPath);
            }
        } catch (IOException e) {
            throw new DBException("Error deleting resource '" + resourcePath + "'", e);
        }
        RMEventManager.fireEvent(
            new RMEvent(RMEvent.Action.RESOURCE_DELETE,
                makeProjectFromId(projectId),
                rmResourcePath
            )
        );
    }

    @Override
    public RMResource[] getResourcePath(@NotNull String projectId, @NotNull String resourcePath) throws DBException {
        return makeResourcePath(projectId, getTargetPath(projectId, resourcePath), false).toArray(RMResource[]::new);
    }

    @NotNull
    @Override
    public byte[] getResourceContents(@NotNull String projectId, @NotNull String resourcePath) throws DBException {
        validateResourcePath(resourcePath);
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
        validateResourcePath(resourcePath);
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

    private void validateResourcePath(String resourcePath) throws DBException {
        if (resourcePath.startsWith(".")) {
            throw new DBException("Resource path '" + resourcePath + "' can't start with dot");
        }
        if (!resourcePath.matches(FILE_REGEX)) {
            String illegalCharacters = resourcePath.replaceAll(FILE_REGEX, " ").strip();
            throw new DBException("Resource path '" + resourcePath + "' contains illegal characters: " + illegalCharacters);
        }
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
        try {
            while (resourcePath.startsWith("/")) resourcePath = resourcePath.substring(1);
            Path targetPath = projectPath.resolve(resourcePath).normalize();
            if (!targetPath.startsWith(projectPath)) {
                throw new DBException("Invalid resource path");
            }
            return WebAppUtils.getWebApplication().getHomeDirectory().relativize(targetPath);
        } catch (InvalidPathException e) {
            throw new DBException("Resource path contains invalid characters");
        }
    }


    private RMProject makeProjectFromId(String projectId) throws DBException {
        var projectName = parseProjectName(projectId);
        var projectPath = getProjectPath(projectId);
        return makeProjectFromPath(projectPath, projectName.getType(), false);
    }

    private RMProject makeProjectFromPath(Path path, RMProject.Type type, boolean checkExistence) {
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
        String projectName = path.getFileName().toString();
        project.setName(projectName);
        project.setId(type.getPrefix() + "_" + projectName);
        project.setType(type);
        if (Files.exists(path)) {
            try {
                project.setCreateTime(
                    OffsetDateTime.ofInstant(Files.getLastModifiedTime(path).toInstant(), ZoneId.of("UTC")));
            } catch (IOException e) {
                log.error(e);
            }
        }

        return project;
    }


    private Path getProjectPath(String projectId) throws DBException {
        RMProjectName project = parseProjectName(projectId);
        RMProject.Type type = project.getType();
        String projectName = project.getName();
        switch (type) {
            case GLOBAL:
                if (!projectName.equals(globalProjectName)) {
                    throw new DBException("Invalid global project name '" + projectName + "'");
                }
                return getGlobalProjectPath();
            case SHARED:
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

    private @NotNull List<RMResource> makeResourcePath(@NotNull String projectId, @NotNull Path targetPath, boolean recursive) throws DBException {
        var projectPath = getProjectPath(projectId);
        var relativeResourcePath = projectPath.relativize(targetPath.toAbsolutePath());
        var resourcePath = projectPath;

        var result = new ArrayList<RMResource>();

        for (var resourceName : relativeResourcePath) {
            resourcePath = resourcePath.resolve(resourceName);
            result.add(makeResourceFromPath(resourcePath, false, false, recursive));
        }

        return result;
    }

    private RMResource makeResourceFromPath(Path path, boolean readProperties, boolean readHistory, boolean recursive) {
        if (path == null || !Files.exists(path)) {
            return null;
        }
        RMResource resource = new RMResource();
        resource.setName(path.getFileName().toString());
        resource.setFolder(Files.isDirectory(path));
        if (!resource.isFolder()) {
            try {
                resource.setLastModified(
                    Files.getLastModifiedTime(path).toMillis());
            } catch (IOException e) {
                log.debug("Error getting last modified time: " + e.getMessage());
            }
        }
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

        if (recursive && resource.isFolder()) {
            try {
                resource.setChildren(
                    readChildResources(path, readProperties, readHistory, recursive));
            } catch (IOException e) {
                log.error(e);
            }
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
            this.rootPath = RMUtils.getRootPath();
            this.userProjectsPath = RMUtils.getUserProjectsPath();
            this.sharedProjectsPath = RMUtils.getSharedProjectsPath();
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

    public static class RMProjectName {
        String prefix;
        String name;
        private RMProjectName(String prefix, String name) {
            this.prefix = prefix;
            this.name = name;
        }

        public String getPrefix() {
            return prefix;
        }

        public String getName() {
            return name;
        }

        public RMProject.Type getType() {
            switch (prefix) {
                case RMProject.PREFIX_GLOBAL: return RMProject.Type.GLOBAL;
                case RMProject.PREFIX_SHARED: return RMProject.Type.SHARED;
                default: return RMProject.Type.USER;
            }
        }
    }
    public static RMProjectName parseProjectName(String projectId) {
        String prefix;
        String name;
        int divPos = projectId.indexOf("_");
        if (divPos < 0) {
            prefix = RMProject.Type.USER.getPrefix();
            name = projectId;
        } else {
            prefix = projectId.substring(0, divPos);
            name = projectId.substring(divPos + 1);
        }
        return new RMProjectName(prefix, name);
    }

    public static boolean isShared(String projectId) {
        RMProjectName rmProjectName = parseProjectName(projectId);
        return RMProject.Type.SHARED.getPrefix().equals(rmProjectName.getPrefix()) ||
            RMProject.Type.GLOBAL.getPrefix().equals(rmProjectName.getPrefix());
    }

}

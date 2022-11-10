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
import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.rm.RMUtils;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.service.sql.WebSQLConstants;
import io.cloudbeaver.utils.WebAppUtils;
import org.eclipse.core.runtime.IPath;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceConfigurationStorage;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.SMCredentials;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.impl.auth.SessionContextImpl;
import org.jkiss.dbeaver.model.rm.*;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.SMObjects;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.registry.*;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Resource manager API
 */
public class LocalResourceController implements RMController {

    private static final Log log = Log.getLog(LocalResourceController.class);

    private static final String FILE_REGEX = "(?U)[\\w.$()@/\\\\ -]+";
    private static final String PROJECT_REGEX = "(?U)[\\w.$()@ -]+"; // slash not allowed in project name

    public static final String DEFAULT_CHANGE_ID = "0";

    private final SMCredentialsProvider credentialsProvider;

    private final Path rootPath;
    private final Path userProjectsPath;
    private final Path sharedProjectsPath;
    private final String globalProjectName;
    private Supplier<SMController> smControllerSupplier;

    private final Map<String, WebProjectImpl> projectRegistries = new LinkedHashMap<>();

    public LocalResourceController(
        SMCredentialsProvider credentialsProvider,
        Path rootPath,
        Path userProjectsPath,
        Path sharedProjectsPath,
        Supplier<SMController> smControllerSupplier
    ) {
        this.credentialsProvider = credentialsProvider;
        this.rootPath = rootPath;
        this.userProjectsPath = userProjectsPath;
        this.sharedProjectsPath = sharedProjectsPath;
        this.smControllerSupplier = smControllerSupplier;

        this.globalProjectName = DBWorkbench.getPlatform().getApplication().getDefaultProjectName();
    }

    protected SMController getSecurityController() {
        return smControllerSupplier.get();
    }

    private Path getGlobalProjectPath() {
        return globalProjectName == null ? null : this.rootPath.resolve(this.globalProjectName);
    }

    private Path getPrivateProjectPath() {
        SMCredentials activeUserCredentials = credentialsProvider.getActiveUserCredentials();
        String userId = activeUserCredentials == null ? null : activeUserCredentials.getUserId();
        return userId == null ? null : this.userProjectsPath.resolve(userId);
    }

    private WebProjectImpl getProjectMetadata(String projectId) throws DBException {
        synchronized (projectRegistries) {
            WebProjectImpl project = projectRegistries.get(projectId);
            if (project == null) {
                SessionContextImpl sessionContext = new SessionContextImpl(null);
                RMProject rmProject = makeProjectFromId(projectId, false);
                project = new WebProjectImpl(
                    this,
                    sessionContext,
                    rmProject,
                    (container) -> true);
                projectRegistries.put(projectId, project);
            }
            return project;
        }
    }

    @NotNull
    @Override
    public RMProject[] listAccessibleProjects() throws DBException {
        List<RMProject> projects;
        //TODO refactor after implement current user api in sm
        var activeUserCreds = credentialsProvider.getActiveUserCredentials();
        if (Files.exists(sharedProjectsPath) && activeUserCreds != null && activeUserCreds.getUserId() != null) {
            projects = readAccessibleSharedProjects(activeUserCreds.getUserId());
        } else {
            projects = new ArrayList<>();
        }

        //FIXME: remove legacy global project support
        //admin has all edit access
        //user has only read access
        var globalProjectPermissions = getProjectPermissions(globalProjectName, RMProjectType.GLOBAL);

        RMProject globalProject = makeProjectFromPath(getGlobalProjectPath(), globalProjectPermissions, RMProjectType.GLOBAL, true);
        if (globalProject != null) {
            projects.add(globalProject);
        }

        //user has full access to his private project
        var userProjectPermission = getProjectPermissions(null, RMProjectType.USER);
        RMProject userProject = makeProjectFromPath(getPrivateProjectPath(), userProjectPermission, RMProjectType.USER, false);
        if (userProject != null) {
            projects.add(0, userProject);
        }
        return projects.toArray(new RMProject[0]);
    }

    private List<RMProject> readAccessibleSharedProjects(@NotNull String userId) throws DBException {
        if (credentialsProvider.hasPermission(DBWConstants.PERMISSION_ADMIN) || credentialsProvider.hasPermission(RMConstants.PERMISSION_RM_ADMIN)) {
            return new ArrayList<>(Arrays.asList(listAllSharedProjects()));
        }
        var accessibleSharedProjects = getSecurityController().getAllAvailableObjectsPermissions(SMObjects.PROJECT);

        return accessibleSharedProjects
            .stream()
            .map(projectPermission -> makeProjectFromPath(
                sharedProjectsPath.resolve(parseProjectName(projectPermission.getObjectId()).getName()),
                projectPermission.getPermissions().stream().map(RMProjectPermission::fromPermission).collect(Collectors.toSet()),
                RMProjectType.SHARED, true)
            )
            .filter(Objects::nonNull)
            .sorted(Comparator.comparing(RMProject::getDisplayName))
            .collect(Collectors.toList());
    }

    private Set<RMProjectPermission> getProjectPermissions(@Nullable String projectId, RMProjectType projectType) throws DBException {
        var activeUserCreds = credentialsProvider.getActiveUserCredentials();

        switch (projectType) {
            case GLOBAL:
                return SMUtils.isRMAdmin(credentialsProvider)
                    ? Set.of(RMProjectPermission.PROJECT_ADMIN)
                    : Set.of(RMProjectPermission.RESOURCE_VIEW, RMProjectPermission.DATA_SOURCES_VIEW);
            case SHARED:
                if (SMUtils.isRMAdmin(credentialsProvider)) {
                    return Set.of(RMProjectPermission.PROJECT_ADMIN);
                }

                if (projectId == null) {
                    throw new DBException("Project id required");
                }

                return getSecurityController().getObjectPermissions(activeUserCreds.getUserId(), projectId, SMObjects.PROJECT)
                    .getPermissions()
                    .stream()
                    .map(RMProjectPermission::fromPermission)
                    .collect(Collectors.toSet());
            case USER:
                return Set.of(RMProjectPermission.RESOURCE_EDIT, RMProjectPermission.DATA_SOURCES_EDIT);
            default:
                throw new DBException("Unknown project type:" + projectType);
        }
    }

    @NotNull
    @Override
    public RMProject[] listAllSharedProjects() throws DBException {
        try {
            if (!Files.exists(sharedProjectsPath)) {
                return new RMProject[0];
            }
            var projects = new ArrayList<RMProject>();
            var allPaths = Files.list(sharedProjectsPath).collect(Collectors.toList());
            for (Path path : allPaths) {
                var projectPerms = getProjectPermissions(
                    makeProjectIdFromPath(path, RMProjectType.SHARED),
                    RMProjectType.SHARED
                );
                var rmProject = makeProjectFromPath(path, projectPerms, RMProjectType.SHARED, false);
                projects.add(rmProject);
            }
            return projects.stream()
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
                Files.createDirectories(sharedProjectsPath);
            } catch (IOException e) {
                throw new DBException("Error creating shared project path", e);
            }
        }
        validateResourcePath(name, PROJECT_REGEX);
        RMProject project;
        var projectPath = sharedProjectsPath.resolve(name);
        if (Files.exists(projectPath)) {
            throw new DBException("Project '" + name + "' already exists");
        }
        project = makeProjectFromPath(projectPath, Set.of(), RMProjectType.SHARED, false);
        if (project == null) {
            throw new DBException("Project '" + name + "' not created");
        }
        try {
            Files.createDirectories(getProjectPath(project.getId()));
            return project;
        } catch (IOException e) {
            throw new DBException("Error creating project path", e);
        }
    }

    @Override
    public void deleteProject(@NotNull String projectId) throws DBException {
        RMProject project = makeProjectFromId(projectId, false);
        Path targetPath = getProjectPath(projectId);
        if (!Files.exists(targetPath)) {
            throw new DBException("Project '" + project.getName() + "' doesn't exists");
        }
        try {
            IOUtils.deleteDirectory(targetPath);
            getSecurityController().deleteAllObjectPermissions(projectId, SMObjects.PROJECT);
        } catch (IOException e) {
            throw new DBException("Error deleting project '" + project.getName() + "'", e);
        }
    }

    @Override
    public RMProject getProject(@NotNull String projectId, boolean readResources, boolean readProperties) throws DBException {
        RMProject project = makeProjectFromId(projectId, true);
        if (readResources) {
            project.setChildren(
                listResources(projectId, null, null, readProperties, false, true)
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
        registry.checkForErrors();
        DataSourceConfigurationManagerBuffer buffer = new DataSourceConfigurationManagerBuffer();
        ((DataSourcePersistentRegistry) registry).saveConfigurationToManager(new VoidProgressMonitor(), buffer, null);
        registry.checkForErrors();
        return new String(buffer.getData(), StandardCharsets.UTF_8);
    }

    @Override
    public void saveProjectDataSources(
        @NotNull String projectId,
        @NotNull String configuration,
        @Nullable List<String> dataSourceIds
    ) throws DBException {
        final DBPProject project = getProjectMetadata(projectId);
        final DBPDataSourceRegistry registry = project.getDataSourceRegistry();
        final DBPDataSourceConfigurationStorage storage = new DataSourceMemoryStorage(configuration.getBytes(StandardCharsets.UTF_8));
        final DataSourceConfigurationManager manager = new DataSourceConfigurationManagerBuffer();
        ((DataSourcePersistentRegistry) registry).loadDataSources(List.of(storage), manager, true, false);
        registry.checkForErrors();
        ((DataSourcePersistentRegistry) registry).saveDataSources();
        registry.checkForErrors();
    }

    @Override
    public void deleteProjectDataSources(@NotNull String projectId, @NotNull String[] dataSourceIds) throws DBException {
        final DBPProject project = getProjectMetadata(projectId);
        final DBPDataSourceRegistry registry = project.getDataSourceRegistry();

        for (String dataSourceId : dataSourceIds) {
            final DBPDataSourceContainer dataSource = registry.getDataSource(dataSourceId);

            if (dataSource != null) {
                registry.removeDataSource(dataSource);
            } else {
                log.warn("Could not find datasource " + dataSourceId + " for deletion");
            }
        }
        registry.checkForErrors();
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
            return readChildResources(projectId, folderPath, nameMask, readProperties, readHistory, recursive);
        } catch (NoSuchFileException e) {
            throw new DBException("Invalid resource folder " + folder);
        } catch (IOException e) {
            throw new DBException("Error reading resources", e);
        }
    }

    @NotNull
    private RMResource[] readChildResources(
        @NotNull String projectId,
        @NotNull Path folderPath,
        @Nullable String nameMask,
        boolean readProperties,
        boolean readHistory,
        boolean recursive
    ) throws IOException {
        try (Stream<Path> files = Files.list(folderPath)) {
            return files.filter(path -> {
                    String fileName = path.getFileName().toString();
                    return (nameMask == null || nameMask.equals(fileName)) && !fileName.startsWith(".");
                }) // skip hidden files
                .sorted(Comparator.comparing(path -> path.getFileName().toString(), String.CASE_INSENSITIVE_ORDER))
                .map((Path path) -> makeResourceFromPath(projectId, path, nameMask, readProperties, readHistory, recursive))
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
                Files.createDirectories(targetPath);
            } else {
                Files.createFile(targetPath);
            }
        } catch (IOException e) {
            throw new DBException("Error creating resource '" + resourcePath + "'", e);
        }
        fireRmResourceAddEvent(projectId, resourcePath);
        return DEFAULT_CHANGE_ID;
    }

    @Override
    public String moveResource(
        @NotNull String projectId,
        @NotNull String oldResourcePath,
        @NotNull String newResourcePath
    ) throws DBException {
        Path oldTargetPath = getTargetPath(projectId, oldResourcePath);
        List<RMResource> rmOldResourcePath = makeResourcePath(projectId, oldTargetPath, false);
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
        // Move properties
        getProjectMetadata(projectId).moveResourceProperties(oldResourcePath, newResourcePath);

        fireRmResourceDeleteEvent(projectId, rmOldResourcePath);
        fireRmResourceAddEvent(projectId, newResourcePath);
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
                IOUtils.deleteDirectory(targetPath);
            } else {
                Files.delete(targetPath);
            }
        } catch (IOException e) {
            throw new DBException("Error deleting resource '" + resourcePath + "'", e);
        }
        // Nullify resource properties if any
        WebProjectImpl project = getProjectMetadata(projectId);
        project.resetResourceProperties(resourcePath);

        fireRmResourceDeleteEvent(projectId, rmResourcePath);
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
        @NotNull byte[] data,
        boolean forceOverwrite) throws DBException
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
        if (!forceOverwrite && Files.exists(targetPath)) {
            throw new DBException("Resource '" + resourcePath + "' exists");
        }
        if (!Files.exists(targetPath.getParent())) {
            throw new DBException("Parent folder '" + targetPath.getParent().getFileName() + "' doesn't exist");
        }
        try {
            Files.write(targetPath, data);
        } catch (IOException e) {
            throw new DBException("Error reading resource '" + resourcePath + "'", e);
        }
        if (!forceOverwrite) {
            fireRmResourceAddEvent(projectId, resourcePath);
        }
        return DEFAULT_CHANGE_ID;
    }

    @NotNull
    @Override
    public String setResourceProperty(
        @NotNull String projectId,
        @NotNull String resourcePath,
        @NotNull String propertyName,
        @Nullable Object propertyValue
    ) throws DBException {
        validateResourcePath(resourcePath);
        getProjectMetadata(projectId).setResourceProperty(resourcePath, propertyName, propertyValue);
        return DEFAULT_CHANGE_ID;
    }

    private void validateResourcePath(String resourcePath) throws DBException {
        validateResourcePath(resourcePath, FILE_REGEX);
    }

    private void validateResourcePath(String resourcePath, String regex) throws DBException {
        if (resourcePath.startsWith(".")) {
            throw new DBException("Resource path '" + resourcePath + "' can't start with dot");
        }
        if (!resourcePath.matches(regex)) {
            String illegalCharacters = resourcePath.replaceAll(regex, " ").strip();
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


    private String makeProjectIdFromPath(Path path, RMProjectType type) {
        String projectName = path.getFileName().toString();
        return type.getPrefix() + "_" + projectName;
    }

    private RMProject makeProjectFromId(String projectId, boolean loadPermissions) throws DBException {
        var projectName = parseProjectName(projectId);
        var projectPath = getProjectPath(projectId);
        Set<RMProjectPermission> permissions = Set.of();
        if (loadPermissions && credentialsProvider.getActiveUserCredentials() != null) {
            permissions = getProjectPermissions(projectId, projectName.getType());
        }
        return makeProjectFromPath(projectPath, permissions, projectName.getType(), false);
    }

    private RMProject makeProjectFromPath(Path path, Set<RMProjectPermission> permissions, RMProjectType type, boolean checkExistence) {
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

        Set<String> allProjectPermissions = permissions.stream()
            .flatMap(rmProjectPermission -> rmProjectPermission.getAllPermissions().stream())
            .collect(Collectors.toSet());

        RMProject project = new RMProject();
        String projectName = path.getFileName().toString();
        project.setName(projectName);
        project.setId(makeProjectIdFromPath(path, type));
        project.setType(type);
        project.setProjectPermissions(allProjectPermissions);
        if (Files.exists(path)) {
            try {
                project.setCreateTime(
                    OffsetDateTime.ofInstant(Files.getLastModifiedTime(path).toInstant(), ZoneId.of("UTC")).toInstant().toEpochMilli());
            } catch (IOException e) {
                log.error(e);
            }
        }

        return project;
    }


    private Path getProjectPath(String projectId) throws DBException {
        RMProjectName project = parseProjectName(projectId);
        RMProjectType type = project.getType();
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
            result.add(makeResourceFromPath(projectId, resourcePath, null, false, false, recursive));
        }

        return result;
    }

    private RMResource makeResourceFromPath(
        @NotNull String projectId,
        @NotNull Path path,
        @Nullable String nameMask,
        boolean readProperties,
        boolean readHistory,
        boolean recursive
    ) {
        if (Files.notExists(path)) {
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
            if (readProperties) {
                final BaseProjectImpl project = (BaseProjectImpl) getProjectMetadata(projectId);
                final String resourcePath = getProjectRelativePath(projectId, path);
                final Map<String, Object> properties = project.getResourceProperties(resourcePath);

                if (properties != null && !properties.isEmpty()) {
                    resource.setProperties(new LinkedHashMap<>(properties));
                }
            }
        } catch (Exception e) {
            log.error(e);
        }

        if (recursive && resource.isFolder()) {
            try {
                resource.setChildren(readChildResources(projectId, path, nameMask, readProperties, readHistory, true));
            } catch (IOException e) {
                log.error(e);
            }
        }

        return resource;
    }

    @NotNull
    private String getProjectRelativePath(@NotNull String projectId, @NotNull Path path) throws DBException {
        return getProjectPath(projectId).toAbsolutePath().relativize(path).toString().replace('\\', IPath.SEPARATOR);
    }

    private void fireRmResourceAddEvent(@NotNull String projectId, @NotNull String resourcePath) throws DBException {
        RMEventManager.fireEvent(
            new RMEvent(RMEvent.Action.RESOURCE_ADD,
                getProject(projectId, false, false),
                Arrays.asList(getResourcePath(projectId, resourcePath)))
        );
    }

    private void fireRmResourceDeleteEvent(@NotNull String projectId, @NotNull List<RMResource> resourcePath) throws DBException {
        RMEventManager.fireEvent(
            new RMEvent(RMEvent.Action.RESOURCE_DELETE,
                makeProjectFromId(projectId, false),
                resourcePath
            )
        );
    }

    public static Builder builder(SMCredentialsProvider credentialsProvider, Supplier<SMController> smControllerSupplier) {
        return new Builder(credentialsProvider, smControllerSupplier);
    }
    public static final class Builder {
        private final SMCredentialsProvider credentialsProvider;
        private final Supplier<SMController> smController;

        private Path rootPath;
        private Path userProjectsPath;
        private Path sharedProjectsPath;

        private Builder(SMCredentialsProvider credentialsProvider, Supplier<SMController> smControllerSupplier) {
            this.credentialsProvider = credentialsProvider;
            this.smController = smControllerSupplier;
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
            return new LocalResourceController(credentialsProvider, rootPath, userProjectsPath, sharedProjectsPath, smController);
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

        public RMProjectType getType() {
            return RMProjectType.getByPrefix(prefix);
        }
    }
    public static RMProjectName parseProjectName(String projectId) {
        String prefix;
        String name;
        int divPos = projectId.indexOf("_");
        if (divPos < 0) {
            prefix = RMProjectType.USER.getPrefix();
            name = projectId;
        } else {
            prefix = projectId.substring(0, divPos);
            name = projectId.substring(divPos + 1);
        }
        return new RMProjectName(prefix, name);
    }

    public static boolean isGlobalProject(String projectId) {
        RMProjectName rmProjectName = parseProjectName(projectId);
        return RMProjectType.GLOBAL.getPrefix().equals(rmProjectName.getPrefix());
    }

    public static boolean isPrivateProject(String projectId, String userId) {
        RMProjectName rmProjectName = parseProjectName(projectId);
        return RMProjectType.USER.getPrefix().equals(rmProjectName.getPrefix()) &&
            rmProjectName.name.equals(userId);
    }



}

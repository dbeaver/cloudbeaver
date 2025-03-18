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

import io.cloudbeaver.BaseWebProjectImpl;
import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.service.sql.WebSQLConstants;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.file.UniversalFileVisitor;
import org.eclipse.core.runtime.IPath;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMCredentials;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.fs.lock.FileLockController;
import org.jkiss.dbeaver.model.impl.app.BaseProjectImpl;
import org.jkiss.dbeaver.model.impl.auth.SessionContextImpl;
import org.jkiss.dbeaver.model.rm.*;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.SMObjectType;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.model.websocket.event.MessageType;
import org.jkiss.dbeaver.model.websocket.event.WSSessionLogUpdatedEvent;
import org.jkiss.dbeaver.registry.ResourceTypeDescriptor;
import org.jkiss.dbeaver.registry.ResourceTypeRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;
import org.jkiss.utils.Pair;

import java.io.IOException;
import java.nio.file.*;
import java.text.MessageFormat;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Resource manager API
 */
public class LocalResourceController extends BaseLocalResourceController {

    private static final Log log = Log.getLog(LocalResourceController.class);

    protected final SMCredentialsProvider credentialsProvider;

    private final Path rootPath;
    private final Path userProjectsPath;
    private final Path sharedProjectsPath;
    private final String globalProjectName;
    private Supplier<SMController> smControllerSupplier;
    protected final List<RMFileOperationHandler> fileHandlers;

    private final Map<String, BaseWebProjectImpl> projectRegistries = new LinkedHashMap<>();

    public LocalResourceController(
        DBPWorkspace workspace,
        SMCredentialsProvider credentialsProvider,
        Path rootPath,
        Path userProjectsPath,
        Path sharedProjectsPath,
        Supplier<SMController> smControllerSupplier
    ) throws DBException {
        super(workspace, new FileLockController(ServletAppUtils.getServletApplication().getApplicationInstanceId()));
        this.credentialsProvider = credentialsProvider;
        this.rootPath = rootPath;
        this.userProjectsPath = userProjectsPath;
        this.sharedProjectsPath = sharedProjectsPath;
        this.smControllerSupplier = smControllerSupplier;

        this.globalProjectName = DBWorkbench.getPlatform().getApplication().getDefaultProjectName();
        this.fileHandlers = RMFileOperationHandlersRegistry.getInstance().getFileHandlers();
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

    protected BaseWebProjectImpl getWebProject(String projectId, boolean refresh) throws DBException {
        synchronized (projectRegistries) {
            BaseWebProjectImpl project = projectRegistries.get(projectId);
            if (project == null || refresh) {
                SessionContextImpl sessionContext = new SessionContextImpl(null);
                RMProject rmProject = makeProjectFromId(projectId, false);
                project = createWebProjectImpl(projectId, sessionContext, rmProject);
                projectRegistries.put(projectId, project);
            }
            return project;
        }
    }

    @NotNull
    protected InternalWebProjectImpl createWebProjectImpl(
        String projectId,
        SessionContextImpl sessionContext,
        RMProject rmProject
    ) throws DBException {
        return new InternalWebProjectImpl(sessionContext, rmProject, getProjectPath(projectId));
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

        // Checking if private projects are enabled in the configuration and if the user has permission to them
        var webApp = ServletAppUtils.getServletApplication();
        var userHasPrivateProjectPermission = userHasAccessToPrivateProject(webApp, activeUserCreds);
        if (webApp.getAppConfiguration().isSupportsCustomConnections() && userHasPrivateProjectPermission) {
            var userProjectPermission = getProjectPermissions(null, RMProjectType.USER);
            RMProject userProject = makeProjectFromPath(getPrivateProjectPath(), userProjectPermission, RMProjectType.USER, false);
            if (userProject != null) {
                projects.add(0, userProject);
            }
        }
        if (ServletAppUtils.getServletApplication().isMultiNode()) {
            for (RMProject rmProject : projects) {
                handleProjectOpened(rmProject.getId());
            }
        }

        projects.sort(Comparator.comparing(RMProject::getDisplayName));
        return projects.toArray(new RMProject[0]);
    }

    private List<RMProject> readAccessibleSharedProjects(@NotNull String userId) throws DBException {
        if (credentialsProvider.hasPermission(DBWConstants.PERMISSION_ADMIN) || credentialsProvider.hasPermission(RMConstants.PERMISSION_RM_ADMIN)) {
            return new ArrayList<>(Arrays.asList(listAllSharedProjects()));
        }
        var accessibleSharedProjects = getSecurityController().getAllAvailableObjectsPermissions(SMObjectType.project);

        return accessibleSharedProjects
            .stream()
            .filter(smObjectPermissions -> CommonUtils.isNotEmpty(smObjectPermissions.getObjectId()))
            .map(projectPermission -> makeProjectFromPath(
                sharedProjectsPath.resolve(parseProjectNameUnsafe(projectPermission.getObjectId()).getName()),
                Arrays.stream(projectPermission.getPermissions()).map(RMProjectPermission::fromPermission).collect(Collectors.toSet()),
                RMProjectType.SHARED, true)
            )
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    private Set<RMProjectPermission> getProjectPermissions(@Nullable String projectId, @NotNull RMProjectType projectType) throws DBException {
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
                return getRmProjectPermissions(projectId, activeUserCreds);
            case USER:
                var webApp = ServletAppUtils.getServletApplication();
                if (userHasAccessToPrivateProject(webApp, activeUserCreds)) {
                    return Set.of(RMProjectPermission.RESOURCE_EDIT, RMProjectPermission.DATA_SOURCES_EDIT);
                }
            default:
                throw new DBException("Unknown project type:" + projectType);
        }
    }

    private boolean userHasAccessToPrivateProject(ServletApplication webApp, @Nullable SMCredentials activeUserCreds) {
        return !webApp.isMultiNode() ||
            (activeUserCreds != null && activeUserCreds.hasPermission(DBWConstants.PERMISSION_PRIVATE_PROJECT_ACCESS));
    }

    @NotNull
    private Set<RMProjectPermission> getRmProjectPermissions(
        @NotNull String projectId, SMCredentials activeUserCreds
    ) throws DBException {
        if (activeUserCreds.getUserId() == null) {
            return Set.of();
        }
        String[] permissions = getSecurityController().getObjectPermissions(activeUserCreds.getUserId(),
            projectId,
            SMObjectType.project
        ).getPermissions();
        return Arrays.stream(permissions).map(RMProjectPermission::fromPermission).collect(Collectors.toSet());
    }

    @NotNull
    @Override
    public RMProject[] listAllSharedProjects() throws DBException {
        try {
            if (!Files.exists(sharedProjectsPath)) {
                return new RMProject[0];
            }
            var projects = new ArrayList<RMProject>();
            try (Stream<Path> list = Files.list(sharedProjectsPath)) {
                var allPaths = list.toList();
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
            }
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
        validateResourcePath(name);
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
            log.debug("Creating project '" + project.getId() + "'");
            Files.createDirectories(projectPath);
            if (ServletAppUtils.getServletApplication().isMultiNode()) {
                createResourceTypeFolders(projectPath);
            }
            fireRmProjectAddEvent(project);
            return project;
        } catch (IOException e) {
            throw new DBException("Error creating project path", e);
        }
    }

    @Override
    public void deleteProject(@NotNull String projectId) throws DBException {
        try (var projectLock = lockController.lock(projectId, "deleteProject")) {
            RMProject project = makeProjectFromId(projectId, false);
            Path targetPath = getProjectPath(projectId);
            if (!Files.exists(targetPath)) {
                log.debug(MessageFormat.format("Project folder ''{0}'' is not found", projectId));
                return;
            }
            try {
                log.debug("Deleting project '" + projectId + "'");
                IOUtils.deleteDirectory(targetPath);
                getSecurityController().deleteAllObjectPermissions(projectId, SMObjectType.project);
                synchronized (projectRegistries) {
                    projectRegistries.remove(projectId);
                }
            } catch (IOException e) {
                throw new DBException("Error deleting project '" + project.getName() + "'", e);
            }
        }
    }

    @Override
    public RMProject getProject(@NotNull String projectId, boolean readResources, boolean readProperties) throws DBException {
        RMProject project = makeProjectFromId(projectId, true);
        if (project == null) {
            return null;
        }
        if (readResources) {
            doProjectOperation(projectId, () -> {
                project.setChildren(
                    listResources(projectId, null, null, readProperties, false, true)
                );
                return null;
            });
        }
        return project;
    }

    @NotNull
    @Override
    public RMResource[] listResources(
        @NotNull String projectId,
        @Nullable String folder,
        @Nullable String nameMask,
        boolean readProperties,
        boolean readHistory,
        boolean recursive
    ) throws DBException {
        Path projectPath = getProjectPath(projectId);
        if (!Files.exists(projectPath)) {
            return new RMResource[0];
        }
        return doProjectOperation(projectId, () -> {
            try {
                Path folderPath = CommonUtils.isEmpty(folder) ?
                    projectPath :
                    projectPath.resolve(folder);
                folderPath = folderPath.normalize();
                // Test that folder is inside the project
                if (!folderPath.startsWith(projectPath)) {
                    throw new DBException("Invalid folder path");
                }
                createFolder(folderPath);
                return readChildResources(projectId, folderPath, nameMask, readProperties, readHistory, recursive);
            } catch (NoSuchFileException e) {
                throw new DBException("Invalid resource folder " + folder);
            } catch (IOException e) {
                throw new DBException("Error reading resources", e);
            }
        });
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
        boolean isFolder
    ) throws DBException {
        try (var ignoredLock = lockController.lock(projectId, "createResource")) {
            validateResourcePath(resourcePath);
            Path targetPath = getTargetPath(projectId, resourcePath);
            if (Files.exists(targetPath)) {
                throw new DBException("Resource '" + resourcePath + "' already exists");
            }
            log.debug("Creating resource '" + resourcePath + "' in project '" + projectId + "'");
            createFolder(targetPath.getParent());
            doFileWriteOperation(projectId, targetPath, () -> {
                try {
                    if (isFolder) {
                        Files.createDirectories(targetPath);
                    } else {
                        Files.createFile(targetPath);
                    }
                } catch (IOException e) {
                    throw new DBException("Error creating resource '" + resourcePath + "'", e);
                }
                return null;
            });
            fireRmResourceAddEvent(projectId, resourcePath);
        }
        return DEFAULT_CHANGE_ID;
    }


    @Override
    public String moveResource(
        @NotNull String projectId,
        @NotNull String oldResourcePath,
        @NotNull String newResourcePath
    ) throws DBException {
        try (var ignoredLock = lockController.lock(projectId, "moveResource")) {
            var normalizedOldResourcePath = CommonUtils.normalizeResourcePath(oldResourcePath);
            var normalizedNewResourcePath = CommonUtils.normalizeResourcePath(newResourcePath);
            if (log.isDebugEnabled()) {
                log.debug("Moving resource from '" + normalizedOldResourcePath + "' to '" + normalizedNewResourcePath +
                    "' in project '" + projectId + "'");
            }
            Path oldTargetPath = getTargetPath(projectId, normalizedOldResourcePath);

            doFileWriteOperation(projectId, oldTargetPath, () -> {
                if (!Files.exists(oldTargetPath)) {
                    throw new DBException("Resource '" + oldTargetPath + "' doesn't exists");
                }
                Path newTargetPath = getTargetPath(projectId, normalizedNewResourcePath);
                validateResourcePath(rootPath.relativize(newTargetPath).toString());
                if (Files.exists(newTargetPath)) {
                    throw new DBException("Resource with name %s already exists".formatted(newTargetPath.getFileName()));
                }
                if (!Files.exists(newTargetPath.getParent())) {
                    throw new DBException("Resource %s doesn't exists".formatted(newTargetPath.getParent().getFileName()));
                }
                try {
                    Files.move(oldTargetPath, newTargetPath);
                } catch (IOException e) {
                    throw new DBException("Error moving resource '" + normalizedOldResourcePath + "'", e);
                }

                log.debug("Moving resource properties");
                try {
                    movePropertiesRecursive(projectId, newTargetPath, normalizedOldResourcePath, normalizedNewResourcePath);
                } catch (IOException | DBException e) {
                    throw new DBException("Unable to move resource properties", e);
                }
                return null;
            });

            fireRmResourceDeleteEvent(projectId, normalizedOldResourcePath);
            fireRmResourceAddEvent(projectId, normalizedNewResourcePath);
        }

        return DEFAULT_CHANGE_ID;
    }

    /**
     * Iterates the tree starting at {@code rootResourcePath}.
     * Calculates for each file/folder {@code newResourcePropertiesPath} and restores {@code oldResourcePropertiesPath}
     * by replacing the first {@code newRootPropertiesPath} with {@code oldRootPropertiesPath} in {@code newResourcePropertiesPath}.
     * Gathers the old-new properties paths pairs and updates properties via BaseProjectImpl#moveResourcePropertiesBatch()
     */
    private void movePropertiesRecursive(
        @NotNull String projectId,
        @NotNull Path rootResourcePath,
        @NotNull String oldRootPropertiesPath,
        @NotNull String newRootPropertiesPath
    ) throws IOException, DBException {
        var project = getWebProject(projectId, false);
        var projectPath = getProjectPath(projectId);
        var propertiesPathsList = new ArrayList<Pair<String, String>>();
        Files.walkFileTree(rootResourcePath, (UniversalFileVisitor<Path>) (path, attrs) -> {
            var newResourcePropertiesPath = CommonUtils.normalizeResourcePath(projectPath.relativize(path.toAbsolutePath()).toString());
            var oldResourcePropertiesPath = newResourcePropertiesPath.replaceFirst(newRootPropertiesPath, oldRootPropertiesPath);
            propertiesPathsList.add(new Pair<>(oldResourcePropertiesPath, newResourcePropertiesPath));
            return FileVisitResult.CONTINUE;
        });
        if (log.isDebugEnabled()) {
            log.debug("Move resources properties:\n" + propertiesPathsList);
        }
        project.moveResourcePropertiesBatch(propertiesPathsList);
    }

    @Override
    public void deleteResource(@NotNull String projectId, @NotNull String resourcePath, boolean recursive) throws DBException {
        try (var ignoredLock = lockController.lock(projectId, "deleteResource")) {
            if (log.isDebugEnabled()) {
                log.debug("Removing resource from '" + resourcePath + "' in project '" + projectId + "'" + (recursive ? " recursive" : ""));
            }
            Path targetPath = getTargetPath(projectId, resourcePath);
            doFileWriteOperation(projectId, targetPath, () -> {
                if (!Files.exists(targetPath)) {
                    throw new DBException("Resource '" + resourcePath + "' doesn't exists");
                }
                Collection<String> propertiesToRemove = List.of();
                try {
                    if (recursive) {
                        propertiesToRemove = getPropertiesToRemove(projectId, targetPath);
                    } else {
                        propertiesToRemove = List.of(resourcePath);
                    }
                } catch (IOException | DBException e) {
                    log.warn("Failed to remove resources properties", e);
                }
                try {
                    if (Files.isDirectory(targetPath)) {
                        IOUtils.deleteDirectory(targetPath);
                    } else {
                        Files.delete(targetPath);
                    }
                } catch (IOException e) {
                    throw new DBException("Error deleting resource '" + resourcePath + "'", e);
                }
                if (log.isDebugEnabled()) {
                    log.debug("Remove resources properties:\n" + propertiesToRemove);
                }
                getWebProject(projectId, false)
                    .resetResourcesPropertiesBatch(propertiesToRemove);
                return null;
            });

            log.debug("Fire resource delete event");
            fireRmResourceDeleteEvent(projectId, resourcePath);
        }
    }

    private Collection<String> getPropertiesToRemove(@NotNull String projectId, @NotNull Path targetPath) throws DBException, IOException {
        var projectPath = getProjectPath(projectId);
        var propertiesToRemove = new ArrayList<String>();
        Files.walkFileTree(targetPath, (UniversalFileVisitor<Path>) (path, attrs) -> {
            var resourcePropertiesPath = projectPath.relativize(path.toAbsolutePath());
            propertiesToRemove.add(CommonUtils.normalizeResourcePath(resourcePropertiesPath.toString()));
            return FileVisitResult.CONTINUE;
        });
        return propertiesToRemove;
    }

    @Override
    public RMResource[] getResourcePath(@NotNull String projectId, @NotNull String resourcePath) throws DBException {
        return makeResourcePath(projectId, getTargetPath(projectId, resourcePath), false).toArray(RMResource[]::new);
    }

    @Nullable
    @Override
    public RMResource getResource(@NotNull String projectId, @NotNull String resourcePath) throws DBException {
        return makeResourceFromPath(projectId, getTargetPath(projectId, resourcePath), null, false, false, false);
    }

    @NotNull
    @Override
    public byte[] getResourceContents(@NotNull String projectId, @NotNull String resourcePath) throws DBException {
        validateResourcePath(resourcePath);
        Path targetPath = getTargetPath(projectId, resourcePath);
        if (!Files.exists(targetPath)) {
            throw new DBException("Resource '" + resourcePath + "' doesn't exists");
        }
        return doFileReadOperation(projectId, targetPath, () -> {
            try {
                return Files.readAllBytes(targetPath);
            } catch (IOException e) {
                throw new DBException("Error reading resource '" + resourcePath + "'", e);
            }
        });
    }

    @NotNull
    @Override
    public String setResourceContents(
        @NotNull String projectId,
        @NotNull String resourcePath,
        @NotNull byte[] data,
        boolean forceOverwrite
    ) throws DBException {
        try (var ignoredLock = lockController.lock(projectId, "setResourceContents")) {
            validateResourcePath(resourcePath);
            Number fileSizeLimit = ServletAppUtils.getServletApplication()
                .getAppConfiguration()
                .getResourceQuota(WebSQLConstants.QUOTA_PROP_RM_FILE_SIZE_LIMIT);
            if (fileSizeLimit != null && data.length > fileSizeLimit.longValue()) {
                throw new DBQuotaException(
                    "File size quota exceeded",
                    WebSQLConstants.QUOTA_PROP_RM_FILE_SIZE_LIMIT,
                    fileSizeLimit.longValue(),
                    data.length
                );
            }
            Path targetPath = getTargetPath(projectId, resourcePath);
            if (!forceOverwrite && Files.exists(targetPath)) {
                throw new DBException("Resource '" + IOUtils.getFileNameWithoutExtension(targetPath) + "' already exists");
            }

            doFileWriteOperation(projectId, targetPath, () -> {
                createFolder(targetPath.getParent());
                try {
                    log.debug("Writing data to resource '" + targetPath + " in project " + projectId + "'");
                    Files.write(targetPath, data);
                } catch (IOException e) {
                    throw new DBException("Error writing resource '" + resourcePath + "'", e);
                }
                return null;
            });

            if (!forceOverwrite) {
                fireRmResourceAddEvent(projectId, resourcePath);
            }
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
        try (var ignoredLock = lockController.lock(projectId, "resourcePropertyUpdate")) {
            validateResourcePath(resourcePath);
            BaseWebProjectImpl webProject = getWebProject(projectId, false);
            doFileWriteOperation(projectId, webProject.getMetadataFilePath(),
                () -> {
                    log.debug("Updating resource property '" + propertyName + "' in project '" + projectId + "'");
                    webProject.setResourceProperty(resourcePath, propertyName, propertyValue);
                    return null;
                }
            );
            return DEFAULT_CHANGE_ID;
        }
    }

    @NotNull
    @Override
    public String setResourceProperties(
        @NotNull String projectId,
        @NotNull String resourcePath,
        @NotNull Map<String, Object> properties
    ) throws DBException {
        try (var ignoredLock = lockController.lock(projectId, "resourcePropertyUpdate")) {
            validateResourcePath(resourcePath);
            BaseWebProjectImpl webProject = getWebProject(projectId, false);
            doFileWriteOperation(projectId, webProject.getMetadataFilePath(),
                () -> {
                    log.debug("Updating resource '" + resourcePath + "' properties in project '" + projectId + "'");
                    webProject.setResourceProperties(resourcePath, properties);
                    return null;
                }
            );
            return DEFAULT_CHANGE_ID;
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
            return targetPath;
        } catch (InvalidPathException e) {
            throw new DBException("Resource path contains invalid characters");
        }
    }


    private String makeProjectIdFromPath(Path path, RMProjectType type) {
        String projectName = path.getFileName().toString();
        return type.getPrefix() + "_" + projectName;
    }

    @Nullable
    protected RMProject makeProjectFromId(String projectId, boolean loadPermissions) throws DBException {
        var projectName = parseProjectName(projectId);
        var projectPath = getProjectPath(projectId);
        if (!Files.exists(projectPath)) {
            if (isPrivateProject(projectId) && isProjectOwner(projectId)) {
                try {
                    Files.createDirectories(projectPath);
                } catch (Exception e) {
                    throw new DBException("Failed to create project " + projectId + ": " + e.getMessage(), e);
                }
            } else {
                return null;
            }
        }
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

        String[] allProjectPermissions = permissions.stream()
            .flatMap(rmProjectPermission -> rmProjectPermission.getAllPermissions().stream())
            .toArray(String[]::new);

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
        // Resource types
        project.setResourceTypes(ResourceTypeRegistry.getInstance().getResourceTypes()
            .stream()
            .filter(ResourceTypeDescriptor::isManagable)
            .map(RMResourceType::new)
            .toArray(RMResourceType[]::new));

        return project;
    }

    private void createResourceTypeFolders(Path path) {
        // FIXME: do not create folders by force!!!
        var resourceTypes = ResourceTypeRegistry.getInstance().getResourceTypes();
        for (var resourceType : resourceTypes) {
            var defaultRoot = resourceType.getDefaultRoot(null);
            if (defaultRoot == null) {
                continue;
            }
            var typeFolder = path.resolve(defaultRoot);
            try {
                if (!Files.exists(typeFolder)) {
                    createFolder(typeFolder);
                }
            } catch (Exception e) {
                log.error("Resource folder " + typeFolder + " is not created", e);
            }
        }
    }

    protected <T> T doProjectOperation(String projectId, RMFileOperation<T> operation) throws DBException {
        for (RMFileOperationHandler fileHandler : fileHandlers) {
            try {
                fileHandler.projectOpened(projectId);
            } catch (Exception e) {
                if (credentialsProvider.getActiveUserCredentials() != null) {
                    ServletAppUtils.getServletApplication().getEventController().addEvent(
                        new WSSessionLogUpdatedEvent(
                            credentialsProvider.getActiveUserCredentials().getSmSessionId(),
                            credentialsProvider.getActiveUserCredentials().getUserId(),
                            MessageType.ERROR,
                            e.getMessage()));
                }
            }
        }
        return operation.doOperation();
    }

    protected <T> T doFileReadOperation(String projectId, Path file, RMFileOperation<T> operation) throws DBException {
        for (RMFileOperationHandler fileHandler : fileHandlers) {
            try {
                fileHandler.beforeFileRead(projectId, file);
            } catch (Exception e) {
                if (credentialsProvider.getActiveUserCredentials() != null) {
                    ServletAppUtils.getServletApplication().getEventController().addEvent(
                        new WSSessionLogUpdatedEvent(
                            credentialsProvider.getActiveUserCredentials().getSmSessionId(),
                            credentialsProvider.getActiveUserCredentials().getUserId(),
                            MessageType.ERROR,
                            e.getMessage()));
                }
                log.error("Error before file reading", e);
            }
        }
        return operation.doOperation();
    }

    protected <T> T doFileWriteOperation(String projectId, Path file, RMFileOperation<T> operation) throws DBException {
        for (RMFileOperationHandler fileHandler : fileHandlers) {
            fileHandler.beforeFileChange(projectId, file);
        }
        T result;
        try {
            result = operation.doOperation();
        } catch (Exception e) {
            for (RMFileOperationHandler fileHandler : fileHandlers) {
                fileHandler.handleFileChangeException(projectId, file, e);
            }
            throw e;
        }
        for (RMFileOperationHandler fileHandler : fileHandlers) {
            fileHandler.afterFileChange(projectId, file, credentialsProvider.getActiveUserCredentials());
        }
        return result;
    }

    protected Path getProjectPath(String projectId) throws DBException {
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
            case USER:
                var activeUserCredentials = credentialsProvider.getActiveUserCredentials();
                var userId = activeUserCredentials == null ? null : activeUserCredentials.getUserId();
                var isAdmin = activeUserCredentials != null && activeUserCredentials.hasPermission(DBWConstants.PERMISSION_ADMIN);
                if (!(projectName.equals(userId) || isAdmin)) {
                    throw new DBException("No access to the project: " + projectName);
                }
                return userProjectsPath.resolve(projectName);
            default:
                throw new DBException("Invalid project type [" + type + "]");
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
                final BaseProjectImpl project = getWebProject(projectId, true);
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

    protected void handleProjectOpened(String projectId) throws DBException {
        createResourceTypeFolders(getProjectPath(projectId));
    }

    public static Builder builder(
        SMCredentialsProvider credentialsProvider,
        DBPWorkspace workspace,
        Supplier<SMController> smControllerSupplier
    ) {
        return new Builder(workspace, credentialsProvider, smControllerSupplier);
    }

    @Override
    public String ping() {
        return "pong (RM)";
    }

    public static class Builder {
        protected final SMCredentialsProvider credentialsProvider;
        protected final Supplier<SMController> smController;
        protected final DBPWorkspace workspace;

        protected Path rootPath;
        protected Path userProjectsPath;
        protected Path sharedProjectsPath;

        protected Builder(
            DBPWorkspace workspace, SMCredentialsProvider credentialsProvider,
            Supplier<SMController> smControllerSupplier
        ) {
            this.workspace = workspace;
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

        public LocalResourceController build() throws DBException {
            return new LocalResourceController(workspace, credentialsProvider, rootPath, userProjectsPath, sharedProjectsPath, smController);
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

    public static RMProjectName parseProjectName(String projectId) throws DBException {
        if (CommonUtils.isEmpty(projectId)) {
            throw new DBException("Project id is empty");
        }
        return parseProjectNameUnsafe(projectId);
    }

    private static RMProjectName parseProjectNameUnsafe(String projectId) {
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
        RMProjectName rmProjectName = parseProjectNameUnsafe(projectId);
        return RMProjectType.GLOBAL.getPrefix().equals(rmProjectName.getPrefix());
    }

    public static boolean isPrivateProject(String projectId) {
        RMProjectName rmProjectName = parseProjectNameUnsafe(projectId);
        return RMProjectType.USER.getPrefix().equals(rmProjectName.getPrefix());
    }

    private boolean isProjectOwner(String projectId) {
        var activeUserCredentials = credentialsProvider.getActiveUserCredentials();
        var userId = activeUserCredentials == null ? null : activeUserCredentials.getUserId();
        return isProjectOwner(projectId, userId);
    }

    public static boolean isProjectOwner(String projectId, String userId) {
        RMProjectName rmProjectName = parseProjectNameUnsafe(projectId);
        return RMProjectType.USER.getPrefix().equals(rmProjectName.getPrefix()) &&
            rmProjectName.name.equals(userId);
    }

}

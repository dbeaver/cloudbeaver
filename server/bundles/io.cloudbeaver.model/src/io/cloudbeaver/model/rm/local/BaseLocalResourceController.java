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

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceConfigurationStorage;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPDataSourceFolder;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.fs.lock.FileLockController;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMEvent;
import org.jkiss.dbeaver.model.rm.RMEventManager;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.registry.*;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.IOUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.function.Predicate;

public abstract class BaseLocalResourceController implements RMController {
    private static final Log log = Log.getLog(BaseLocalResourceController.class);

    public static final String DEFAULT_CHANGE_ID = "0";

    @NotNull
    protected final DBPWorkspace workspace;
    @NotNull
    protected final FileLockController lockController;

    protected BaseLocalResourceController(
        @NotNull DBPWorkspace workspace,
        @NotNull FileLockController lockController
    ) {
        this.workspace = workspace;
        this.lockController = lockController;
    }

    @Nullable
    @Override
    public RMProject getProject(@NotNull String projectId, boolean readResources, boolean readProperties)
        throws DBException {
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

    @Nullable
    @Override
    public Object getProjectProperty(@NotNull String projectId, @NotNull String propName) throws DBException {
        var project = getWebProject(projectId, false);
        return doFileReadOperation(projectId,
            project.getMetadataFilePath(),
            () -> project.getProjectProperty(propName));
    }

    @Override
    public void setProjectProperty(
        @NotNull String projectId,
        @NotNull String propName,
        @Nullable Object propValue
    ) throws DBException {
        RMLocalProject webProject = getWebProject(projectId, false);
        doFileWriteOperation(projectId, webProject.getMetadataFilePath(),
            () -> {
                log.debug("Updating value for property '" + propName + "' in project '" + projectId + "'");
                webProject.setProjectProperty(propName, propValue);
                return null;
            }
        );
    }

    @Override
    public String getProjectsDataSources(@NotNull String projectId, @Nullable String[] dataSourceIds)
        throws DBException {
        DBPProject projectMetadata = getWebProject(projectId, false);
        return doFileReadOperation(
            projectId,
            projectMetadata.getMetadataFolder(false),
            () -> {
                DBPDataSourceRegistry registry = projectMetadata.getDataSourceRegistry();
                registry.refreshConfig();
                registry.checkForErrors();
                DataSourceConfigurationManagerBuffer buffer = new DataSourceConfigurationManagerBuffer();
                Predicate<DBPDataSourceContainer> filter = null;
                if (!ArrayUtils.isEmpty(dataSourceIds)) {
                    filter = ds -> ArrayUtils.contains(dataSourceIds, ds.getId());
                }
                ((DataSourcePersistentRegistry) registry).saveConfigurationToManager(new VoidProgressMonitor(),
                    buffer,
                    filter);
                registry.checkForErrors();

                return new String(buffer.getData(), StandardCharsets.UTF_8);
            }
        );
    }

    @Override
    public void createProjectDataSources(
        @NotNull String projectId,
        @NotNull String configuration,
        @Nullable List<String> dataSourceIds
    ) throws DBException {
        updateProjectDataSources(projectId, configuration, dataSourceIds);
    }

    @Override
    public boolean updateProjectDataSources(
        @NotNull String projectId,
        @NotNull String configuration,
        @Nullable List<String> dataSourceIds
    ) throws DBException {
        return updateProjectDataSourcesConfig(projectId, configuration, dataSourceIds) != null;
    }

    @Nullable
    protected DataSourceParseResults updateProjectDataSourcesConfig(
        @NotNull String projectId,
        @NotNull String configuration,
        @Nullable List<String> dataSourceIds
    ) throws DBException {
        try (var ignoredLock = lockController.lock(projectId, "updateProjectDataSources")) {
            DBPProject project = getWebProject(projectId, false);
            return doFileWriteOperation(
                projectId, project.getMetadataFolder(false),
                () -> {
                    DBPDataSourceRegistry registry = project.getDataSourceRegistry();
                    DBPDataSourceConfigurationStorage storage = new DataSourceMemoryStorage(configuration.getBytes(
                        StandardCharsets.UTF_8));
                    DataSourceConfigurationManager manager = new DataSourceConfigurationManagerBuffer();
                    final DataSourceParseResults parseResults = ((DataSourcePersistentRegistry) registry).loadDataSources(
                        List.of(storage),
                        manager,
                        dataSourceIds,
                        true,
                        dataSourceIds == null
                    );
                    registry.checkForErrors();
                    log.debug("Save data sources configuration in project '" + projectId + "'");
                    ((DataSourcePersistentRegistry) registry).saveDataSources();
                    registry.checkForErrors();
                    return parseResults;
                }
            );
        }
    }

    @Override
    public void deleteProjectDataSources(
        @NotNull String projectId,
        @NotNull String[] dataSourceIds
    ) throws DBException {
        try (var ignoredLock = lockController.lock(projectId, "deleteDataSources")) {
            DBPProject project = getWebProject(projectId, false);
            doFileWriteOperation(projectId, project.getMetadataFolder(false), () -> {
                DBPDataSourceRegistry registry = project.getDataSourceRegistry();
                for (String dataSourceId : dataSourceIds) {
                    DBPDataSourceContainer dataSource = registry.getDataSource(dataSourceId);

                    if (dataSource != null) {
                        log.debug("Deleting data source '" + dataSourceId + "' in project '" + projectId + "'");
                        registry.removeDataSource(dataSource);
                    } else {
                        log.warn("Could not find datasource " + dataSourceId + " for deletion");
                    }
                }
                registry.checkForErrors();
                return null;
            });
        }
    }

    @Override
    public void createProjectDataSourceFolder(
        @NotNull String projectId,
        @NotNull String folderPath
    ) throws DBException {
        try (var ignoredLock = lockController.lock(projectId, "createDatasourceFolder")) {
            DBPProject project = getWebProject(projectId, false);
            log.debug("Creating data source folder '" + folderPath + "' in project '" + projectId + "'");
            doFileWriteOperation(projectId, project.getMetadataFolder(false),
                () -> {
                    DBPDataSourceRegistry registry = project.getDataSourceRegistry();
                    var result = Path.of(folderPath);
                    var newName = result.getFileName().toString();
                    GeneralUtils.validateResourceName(newName);
                    var parent = result.getParent();
                    var parentFolder = parent == null ? null : registry.getFolder(parent.toString().replace("\\", "/"));
                    registry.addFolder(parentFolder, newName);
                    if (registry instanceof DataSourcePersistentRegistry pr) {
                        pr.saveDataSources();
                    }
                    registry.checkForErrors();
                    return null;
                }
            );
        }
    }

    @Override
    public void deleteProjectDataSourceFolders(
        @NotNull String projectId,
        @NotNull String[] folderPaths,
        boolean dropContents
    ) throws DBException {
        try (var ignoredLock = lockController.lock(projectId, "createDatasourceFolder")) {
            DBPProject project = getWebProject(projectId, false);
            doFileWriteOperation(projectId, project.getMetadataFolder(false),
                () -> {
                    DBPDataSourceRegistry registry = project.getDataSourceRegistry();
                    for (String folderPath : folderPaths) {
                        DBPDataSourceFolder folder = registry.getFolder(folderPath);
                        log.debug("Deleting data source folder '" + folderPath + "' in project '" + projectId + "'");
                        registry.removeFolder(folder, dropContents);
                    }
                    if (registry instanceof DataSourcePersistentRegistry pr) {
                        pr.saveDataSources();
                    }
                    registry.checkForErrors();
                    return null;
                }
            );
        }
    }

    @Override
    public void moveProjectDataSourceFolder(
        @NotNull String projectId,
        @NotNull String oldPath,
        @NotNull String newPath
    ) throws DBException {
        try (var ignoredLock = lockController.lock(projectId, "createDatasourceFolder")) {
            DBPProject project = getWebProject(projectId, false);
            log.debug("Moving data source folder from '" + oldPath + "' to '" + newPath + "' in project '" + projectId + "'");
            doFileWriteOperation(projectId, project.getMetadataFolder(false),
                () -> {
                    DBPDataSourceRegistry registry = project.getDataSourceRegistry();
                    registry.moveFolder(oldPath, newPath);
                    registry.checkForErrors();
                    ((DataSourcePersistentRegistry) registry).saveDataSources();
                    return null;
                }
            );
        }
    }

    protected abstract RMLocalProject getWebProject(@NotNull String projectId, boolean refresh) throws DBException;

    protected abstract <T> T doFileWriteOperation(@NotNull String projectId, @NotNull Path file, @NotNull RMFileOperation<T> operation)
        throws DBException;

    protected abstract <T> T doFileReadOperation(@NotNull String projectId, @NotNull Path file, @NotNull RMFileOperation<T> operation)
        throws DBException;

    protected abstract <T> T doProjectOperation(@NotNull String projectId, @NotNull RMFileOperation<T> operation) throws DBException;

    protected abstract RMProject makeProjectFromId(@NotNull String projectId, boolean loadPermissions) throws DBException;

    protected void validateResourcePath(@NotNull String resourcePath) throws DBException {
        var fullPath = Paths.get(resourcePath);
        for (Path path : fullPath) {
            String fileName = IOUtils.getFileNameWithoutExtension(path);
            GeneralUtils.validateResourceName(fileName);
        }
    }

    protected void createFolder(Path targetPath) throws DBException {
        if (!Files.exists(targetPath)) {
            try {
                Files.createDirectories(targetPath);
            } catch (IOException e) {
                throw new DBException("Error creating folder '" + targetPath + "'");
            }
        }
    }

    protected void fireRmResourceAddEvent(@NotNull String projectId, @NotNull String resourcePath) throws DBException {
        RMEventManager.fireEvent(
            new RMEvent(RMEvent.Action.RESOURCE_ADD,
                getProject(projectId, false, false),
                resourcePath)
        );
    }

    protected void fireRmResourceDeleteEvent(@NotNull String projectId, @NotNull String resourcePath)
        throws DBException {
        RMEventManager.fireEvent(
            new RMEvent(RMEvent.Action.RESOURCE_DELETE,
                makeProjectFromId(projectId, false),
                resourcePath
            )
        );
    }

    protected void fireRmProjectAddEvent(@NotNull RMProject project) {
        RMEventManager.fireEvent(
            new RMEvent(
                RMEvent.Action.RESOURCE_ADD,
                project
            )
        );
    }
}

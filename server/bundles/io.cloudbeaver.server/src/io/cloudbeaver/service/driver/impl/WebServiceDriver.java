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
package io.cloudbeaver.service.driver.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebDatabaseDriverInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebDataSourceProviderInfo;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.driver.DBWServiceDriver;
import io.cloudbeaver.service.driver.WebDatabaseDriverConfig;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.DBFileController;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.connection.DBPDriverLibrary;
import org.jkiss.dbeaver.registry.DataSourceProviderDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.driver.DriverDescriptor;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.Part;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class WebServiceDriver implements DBWServiceDriver {

    private static final Log log = Log.getLog(WebServiceDriver.class);

    public List<WebDatabaseDriverInfo> getDriverList(@NotNull WebSession webSession, String driverId) {
        List<WebDatabaseDriverInfo> result = new ArrayList<>();
        for (DBPDriver driver : CBPlatform.getInstance().getApplicableDrivers()) {
            if (driverId == null || driverId.equals(driver.getFullId())) {
                result.add(new WebDatabaseDriverInfo(webSession, driver));
            }
        }
        return result;
    }

    public List<WebDataSourceProviderInfo> getDriverProviderList(@NotNull WebSession webSession) throws DBWebException {
        return DataSourceProviderRegistry.getInstance().getEnabledDataSourceProviders().stream()
            .map(WebDataSourceProviderInfo::new)
            .collect(Collectors.toList());
    }

    public WebDatabaseDriverInfo createDriver(@NotNull WebSession webSession, @NotNull WebDatabaseDriverConfig config) throws DBWebException {
        DataSourceProviderDescriptor descriptor = DataSourceProviderRegistry.getInstance().getDataSourceProvider(config.getProviderId());
        if (descriptor == null) {
            throw new DBWebException("Data source provider '" + config.getProviderId() + "' is not found");
        }

        var driver = descriptor.createDriver();
        WebServiceUtils.setDriverConfiguration(driver, config);
        DriverDescriptor oldDriver = descriptor.getDriverByName(driver.getCategory(), driver.getName());
        if (oldDriver != null && oldDriver != driver && !oldDriver.isDisabled() && oldDriver.getReplacedBy() == null) {
            throw new DBWebException("Driver '" + config.getDriverName() + "' already exists. Change driver name");
        }
        if (descriptor.getDriver(driver.getId()) == null) {
            descriptor.addDriver(driver);
        }
        descriptor.getRegistry().saveDrivers();
        CBPlatform.getInstance().refreshApplicableDrivers();
        return new WebDatabaseDriverInfo(webSession, driver);
    }

    public WebDatabaseDriverInfo updateDriver(@NotNull WebSession webSession, @NotNull WebDatabaseDriverConfig config) throws DBWebException {
        var driver = DataSourceProviderRegistry.getInstance().findDriver(config.getDriverId());
        if (driver == null) {
            throw new DBWebException("Data source driver '" + config.getDriverId() + "' is not found");
        }
        WebServiceUtils.setDriverConfiguration((DriverDescriptor) driver, config);
        ((DataSourceProviderDescriptor) driver.getProviderDescriptor()).getRegistry().saveDrivers();
        return new WebDatabaseDriverInfo(webSession, driver);
    }

    public boolean deleteDriver(@NotNull WebSession session, @NotNull String driverId) throws DBWebException {
        DriverDescriptor driver = (DriverDescriptor) DataSourceProviderRegistry.getInstance().findDriver(driverId);
        if (driver == null) {
            throw new DBWebException("Data source driver '" + driverId + "' is not found");
        }

        driver.getProviderDescriptor().removeDriver(driver);
        driver.getProviderDescriptor().getRegistry().saveDrivers();
        CBPlatform.getInstance().refreshApplicableDrivers();
        return true;
    }

    public boolean addDriverLibraries(
        @NotNull WebSession session,
        @NotNull String driverId,
        @NotNull Collection<Part> requestParts
    ) throws DBWebException {
        DriverDescriptor driver = (DriverDescriptor) DataSourceProviderRegistry.getInstance().findDriver(driverId);
        if (driver == null) {
            throw new DBWebException("Data source driver '" + driverId + "' is not found");
        }
        for (Part part : requestParts) {
            var shortFileName = part.getSubmittedFileName();
            if (CommonUtils.isEmpty(shortFileName)) {
                continue;
            }
            try {
                String filePath = DBConstants.DEFAULT_DRIVERS_FOLDER + "/" + driver.getId() + "/" + shortFileName;
                var cachedDriverLibrary = driver.getDriverLibrary(filePath);
                if (cachedDriverLibrary != null && cachedDriverLibrary.isDeleteAfterRestart()) {
                    throw new DBWebException("File with the name '" + shortFileName + 
                        " is already exists and it will be deleted after server restart. Please, rename the file");
                }
                DriverDescriptor.DriverFileInfo fileInfo = new DriverDescriptor.DriverFileInfo(
                    shortFileName,
                    null,
                    filePath.endsWith(".jar") || filePath.endsWith(".zip") ? DBPDriverLibrary.FileType.jar : DBPDriverLibrary.FileType.lib,
                    Path.of(filePath));

                // driver descriptor can't seek drivers in local file controller, so we can't use file controller in embedded product
                saveDriverFile(session, part, filePath, fileInfo);
                // add library to the driver configuration
                var driverLibrary = driver.addDriverLibrary(filePath, DBPDriverLibrary.FileType.jar);
                driver.addLibraryFile(driverLibrary, fileInfo);
            } catch (IOException | DBException e) {
                throw new DBWebException("IO error while saving driver file", e);
            } finally {
                DataSourceProviderRegistry.getInstance().saveDrivers();
            }
        }
        return true;
    }

    private void saveDriverFile(
        @NotNull WebSession session,
        Part part,
        String filePath,
        DriverDescriptor.DriverFileInfo fileInfo
    ) throws DBException, IOException {
        if (CBApplication.getInstance().isMultiNode()) {
            DBFileController fileController = session.getFileController();
            fileController.saveFileData(
                DBFileController.TYPE_DATABASE_DRIVER,
                filePath,
                part.getInputStream().readAllBytes());
        } else {
            // save file in the local node
            Path path = Path.of(CBApplication.getInstance().getDriversLocation()).resolveSibling(filePath);
            if (!Files.exists(path.getParent())) {
                Files.createDirectories(path.getParent());
            }
            if (Files.exists(path)) {
                throw new DBWebException("File with path " + filePath + " already exists. Please, rename the file.");
            }
            part.write(path.toString());
            fileInfo.setFileCRC(DriverDescriptor.calculateFileCRC(path));
        }
    }

    public boolean deleteDriverLibraries(
        @NotNull WebSession session,
        @NotNull String driverId,
        @NotNull List<String> libraryIds
    ) throws DBWebException {
        DriverDescriptor driver = (DriverDescriptor) DataSourceProviderRegistry.getInstance().findDriver(driverId);
        if (driver == null) {
            throw new DBWebException("Data source driver '" + driverId + "' is not found");
        }
            // driver descriptor can't seek drivers in local file controller, so we can't use file controller in embedded product
            for (String libraryId : libraryIds) {
                var driverLibrary = driver.getDriverLibrary(libraryId);
                if (driverLibrary == null) {
                    continue;
                }
                try {
                    WebServiceUtils.deleteDriverLibraryLocalFile(session.getFileController(), driver, driverLibrary);
                    driver.deleteDriverLibrary(driverLibrary);
                } catch (DBWebException e) {
                    log.debug("Driver library local file is not deleted", e);
                    // remove it after restart
                    driverLibrary.setDeleteAfterRestart(true);
                }
            }
        DataSourceProviderRegistry.getInstance().saveDrivers();
        return true;
    }
}

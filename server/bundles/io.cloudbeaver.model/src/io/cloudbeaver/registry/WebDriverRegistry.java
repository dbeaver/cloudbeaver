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
package io.cloudbeaver.registry;

import org.eclipse.core.runtime.IConfigurationElement;
import org.eclipse.core.runtime.IExtensionRegistry;
import org.eclipse.core.runtime.Platform;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.connection.DBPDataSourceProviderDescriptor;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.connection.DBPDriverLibrary;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

public class WebDriverRegistry {

    private static final Log log = Log.getLog(WebDriverRegistry.class);

    private static final String EXTENSION_ID = "io.cloudbeaver.driver"; //$NON-NLS-1$
    private static final String TAG_DRIVER = "driver"; //$NON-NLS-1$

    private static WebDriverRegistry instance = null;

    public synchronized static WebDriverRegistry getInstance() {
        if (instance == null) {
            instance = new WebDriverRegistry();
            instance.loadExtensions(Platform.getExtensionRegistry());
        }
        return instance;
    }

    private final List<DBPDriver> applicableDrivers = new ArrayList<>();
    private final Set<String> webDrivers = new HashSet<>();

    protected WebDriverRegistry() {
    }

    private void loadExtensions(IExtensionRegistry registry) {
        {
            IConfigurationElement[] extConfigs = registry.getConfigurationElementsFor(EXTENSION_ID);
            for (IConfigurationElement ext : extConfigs) {
                // Load webServices
                if (TAG_DRIVER.equals(ext.getName())) {
                    this.webDrivers.add(ext.getAttribute("id"));
                }
            }
        }
    }

    public List<DBPDriver> getApplicableDrivers() {
        return applicableDrivers;
    }

    /**
     * Updates info about applicable drivers (f.e. some changes were made in driver config file).
     */
    public void refreshApplicableDrivers() {
        this.applicableDrivers.clear();
        this.getSupportedFileOpenExtension().clear();
        this.applicableDrivers.addAll(
            DataSourceProviderRegistry.getInstance().getEnabledDataSourceProviders().stream()
                .map(DBPDataSourceProviderDescriptor::getEnabledDrivers)
                .flatMap(List::stream)
                .filter(this::isDriverApplicable)
                .peek(this::refreshFileExtensions)
                .toList());

        log.info("Available drivers: " + applicableDrivers.stream().map(DBPDriver::getFullName).collect(Collectors.joining(",")));
    }

    @NotNull
    public Map<String, Set<DBPDriver>> getSupportedFileOpenExtension() {
        return new HashMap<>();
    }

    protected void refreshFileExtensions(DBPDriver dbpDriver) {
    }

    protected boolean isDriverApplicable(@NotNull DBPDriver driver) {
        List<? extends DBPDriverLibrary> libraries = driver.getDriverLibraries();
        if (!webDrivers.contains(driver.getFullId())) {
            return false;
        }
        boolean hasAllFiles = true;
        for (DBPDriverLibrary lib : libraries) {
            if (!isDriverLibraryFilePresent(lib)) {
                hasAllFiles = false;
                log.error("\tDriver '" + driver.getId() + "' is missing library '" + lib.getDisplayName() + "'");
            } else {
                if (lib.getType() == DBPDriverLibrary.FileType.jar) {
                    return true;
                }
            }
        }
        return hasAllFiles;
    }

    private boolean isDriverLibraryFilePresent(@NotNull DBPDriverLibrary lib) {
        if (lib.getType() == DBPDriverLibrary.FileType.license) {
            return true;
        }
        Path localFile = lib.getLocalFile();
        return localFile != null && Files.exists(localFile);
    }
}

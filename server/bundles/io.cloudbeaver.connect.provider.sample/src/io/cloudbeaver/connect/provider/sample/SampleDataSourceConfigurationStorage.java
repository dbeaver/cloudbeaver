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
package io.cloudbeaver.connect.provider.sample;

import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceConfigurationStorage;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Sample configuration storage.
 * Is the main source of data in web application
 */
public class SampleDataSourceConfigurationStorage implements DBPDataSourceConfigurationStorage {

    private static final Log log = Log.getLog(SampleDataSourceConfigurationStorage.class);

    public static final String SAMPLE_CONFIG_NAME = "provided-connections.json";

    @Override
    public String getStorageId() {
        return "Sample";
    }

    @Override
    public boolean isValid() {
        return false;
    }

    @Override
    public boolean isDefault() {
        return false;
    }

    @Override
    public String getStatus() {
        return "Valid";
    }

    @Override
    public List<? extends DBPDataSourceContainer> loadDataSources(DBPDataSourceRegistry registry, Map<String, Object> options) throws DBException {
        Path metadataFolder = registry.getProject().getMetadataFolder(false);
        if (Files.exists(metadataFolder)) {
            Path sampleConfigFile = metadataFolder.resolve(SAMPLE_CONFIG_NAME);
            if (Files.exists(sampleConfigFile)) {
                log.debug("Loading provided connections from [" + sampleConfigFile.toAbsolutePath() + "]");
                List<? extends DBPDataSourceContainer> dsList = registry.loadDataSourcesFromFile(this, sampleConfigFile);
//                for (DBPDataSourceContainer ds : dsList) {
//                    log.debug("\tProvided connection: " + ds.getName());
//                }
                return dsList;
            }
        }
        return Collections.emptyList();
    }

    @Override
    public String getConfigurationFileSuffix() {
        return "-sample";
    }

}

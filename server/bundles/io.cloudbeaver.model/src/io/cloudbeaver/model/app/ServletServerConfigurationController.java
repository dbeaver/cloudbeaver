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
package io.cloudbeaver.model.app;

import com.google.gson.Gson;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;

import java.nio.file.Path;
import java.util.Map;

/**
 * Server configuration controller.
 * Works with app server configuration (loads, updates)
 */
public interface ServletServerConfigurationController<T extends ServletServerConfiguration> {

    /**
     * Loads server configuration.
     */
    void loadServerConfiguration(Path configPath) throws DBException;

    @NotNull
    default Map<String, Object> getOriginalConfigurationProperties() {
        return Map.of();
    }

    @NotNull
    Path getWorkspacePath();

    @NotNull
    Gson getGson();

    void validateFinalServerConfiguration() throws DBException;
}

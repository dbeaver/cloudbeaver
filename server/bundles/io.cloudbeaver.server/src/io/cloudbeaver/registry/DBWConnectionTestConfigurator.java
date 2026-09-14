/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebParameterSecure;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;

import java.util.Map;

/**
 * Configures a temporary data source before a generic connection test.
 */
public interface DBWConnectionTestConfigurator {
    void configure(
        @NotNull DBPProject project,
        @Nullable DataSourceDescriptor originalDataSource,
        @NotNull DataSourceDescriptor testDataSource,
        @WebParameterSecure @NotNull Map<String, Object> configuration
    ) throws DBWebException;
}

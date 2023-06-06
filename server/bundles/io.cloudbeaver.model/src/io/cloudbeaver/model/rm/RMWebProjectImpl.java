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
package io.cloudbeaver.model.rm;

import io.cloudbeaver.WebProjectImpl;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.registry.DataSourceRegistry;

public class RMWebProjectImpl extends WebProjectImpl {
    public RMWebProjectImpl(
        @NotNull DBPWorkspace workspace,
        @NotNull RMController resourceController,
        @NotNull SMSessionContext sessionContext,
        @NotNull RMProject project
    ) {
        super(workspace, resourceController, sessionContext, project, (container) -> true);
    }

    @NotNull
    @Override
    protected DBPDataSourceRegistry createDataSourceRegistry() {
        return new DataSourceRegistry(this);
    }
}

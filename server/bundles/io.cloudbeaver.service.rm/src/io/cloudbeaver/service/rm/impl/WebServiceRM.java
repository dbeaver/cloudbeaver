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
package io.cloudbeaver.service.rm.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.rm.DBWServiceRM;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;

import java.nio.charset.StandardCharsets;

/**
 * Web service implementation
 */
public class WebServiceRM implements DBWServiceRM {

    @Override
    public RMProject[] listProjects(WebSession webSession) throws DBWebException {
        try {
            return getResourceController(webSession).listAccessibleProjects();
        } catch (DBException e) {
            throw new DBWebException("Error reading list of accessible projects", e);
        }
    }

    @NotNull
    @Override
    public RMResource[] listResources(WebSession webSession, @NotNull String projectId, @Nullable String folder, @Nullable String nameMask, boolean readProperties, boolean readHistory) throws DBException {
        try {
            return getResourceController(webSession).listResources(projectId, folder, nameMask, readProperties, readHistory);
        } catch (DBException e) {
            throw new DBWebException("Error reading list of accessible projects", e);
        }
    }

    @Override
    public String readResourceAsString(@NotNull WebSession webSession, @NotNull String projectId, @NotNull String resourcePath) throws DBException {
        try {
            byte[] data = getResourceController(webSession).getResourceContents(projectId, resourcePath);
            return new String(data, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new DBWebException("Error reading list of accessible projects", e);
        }
    }

    private RMController getResourceController(WebSession webSession) {
        return CBApplication.getInstance().getResourceController(webSession);
    }
}

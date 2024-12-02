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
package io.cloudbeaver.model;

import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.security.SMUtils;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.rm.RMResourceType;
import org.jkiss.utils.ArrayUtils;

import java.util.ArrayList;

public class WebProjectInfo {
    private final WebSession session;
    private final WebProjectImpl project;
    private final boolean customPrivateConnectionsEnabled;

    public WebProjectInfo(WebSession session, WebProjectImpl project, boolean customPrivateConnectionsEnabled) {
        this.session = session;
        this.project = project;
        this.customPrivateConnectionsEnabled = customPrivateConnectionsEnabled;
    }

    public WebSession getSession() {
        return session;
    }

    public DBPProject getProject() {
        return project;
    }

    @Property
    public String getId() {
        return project.getId();
    }

    @Property
    public boolean isGlobal() {
        return project.getRMProject().isGlobal();
    }

    @Property
    public boolean isShared() {
        return project.getRMProject().isShared();
    }

    @Property
    public String getName() {
        return project.getName();
    }

    @Property
    public String getDescription() {
        return null;
    }

    @Property
    public boolean isCanEditDataSources() {
        if (project.getRMProject().getType() == RMProjectType.USER && !customPrivateConnectionsEnabled) {
            return false;
        }
        return hasDataSourcePermission(RMProjectPermission.DATA_SOURCES_EDIT);
    }

    @Property
    public boolean isCanViewDataSources() {
        return hasDataSourcePermission(RMProjectPermission.DATA_SOURCES_VIEW);
    }

    @Property
    public boolean isCanEditResources() {
        return hasDataSourcePermission(RMProjectPermission.RESOURCE_EDIT);
    }

    @Property
    public boolean isCanViewResources() {
        return hasDataSourcePermission(RMProjectPermission.RESOURCE_VIEW);
    }

    private boolean hasDataSourcePermission(RMProjectPermission permission) {
        return SMUtils.hasProjectPermission(session, project.getRMProject(), permission);
    }

    @Property
    public RMResourceType[] getResourceTypes() {
        RMResourceType[] resourceTypes = project.getRMProject().getResourceTypes();

        if(resourceTypes == null) {
            return ArrayUtils.toArray(RMResourceType.class, new ArrayList<>());
        }

        return resourceTypes;
    }
}

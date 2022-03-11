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
package io.cloudbeaver.model;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.utils.WebCommonUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPDataSourceOrigin;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.meta.Property;

import java.util.Map;

/**
 * Web connection origin info
 */
public class WebConnectionOriginInfo implements WebObjectOrigin {

    private final WebSession session;
    private final DBPDataSourceContainer dataSourceContainer;
    private final DBPDataSourceOrigin origin;

    public WebConnectionOriginInfo(WebSession session, DBPDataSourceContainer dataSourceContainer, DBPDataSourceOrigin origin) {
        this.session = session;
        this.dataSourceContainer = dataSourceContainer;
        this.origin = origin;
    }

    @NotNull
    @Override
    public String getType() {
        return origin.getType();
    }

    @Nullable
    @Override
    public String getSubType() {
        return origin.getSubType();
    }

    @NotNull
    @Override
    public String getDisplayName() {
        return origin.getDisplayName();
    }

    @Nullable
    @Override
    public String getIcon() {
        return WebCommonUtils.makeIconId(origin.getIcon());
    }

    @NotNull
    @Override
    public Map<String, Object> getConfiguration() {
        return origin.getDataSourceConfiguration();
    }

    @Property
    @Override
    public WebPropertyInfo[] getDetails() throws DBWebException {
        try {
            DBPObject details = origin.getObjectDetails(session.getProgressMonitor(), session.getSessionContext(), dataSourceContainer);
            if (details == null) {
                return new WebPropertyInfo[0];
            }
            return WebCommonUtils.getObjectProperties(session, details);
        } catch (DBException e) {
            throw new DBWebException("Error reading origin details", e);
        }
    }

}

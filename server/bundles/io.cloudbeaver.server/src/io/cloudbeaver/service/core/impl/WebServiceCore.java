/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
package io.cloudbeaver.service.core.impl;


import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebDataSourceConfig;
import io.cloudbeaver.model.WebDatabaseDriverConfig;
import io.cloudbeaver.model.WebServerConfig;
import io.cloudbeaver.model.WebServerMessage;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import io.cloudbeaver.service.core.DBWServiceCore;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.exec.DBCException;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;

/**
 * Web service implementation
 */
public class WebServiceCore implements DBWServiceCore {

    private static final Log log = Log.getLog(WebServiceCore.class);

    @Override
    public WebServerConfig getServerConfig() {
        return new WebServerConfig(CBApplication.getInstance());
    }

    @Override
    public List<WebDatabaseDriverConfig> getDriverList(WebSession webSession, String driverId) {
        List<WebDatabaseDriverConfig> result = new ArrayList<>();
        for (DBPDriver driver : CBPlatform.getInstance().getApplicableDrivers()) {
            if (driverId == null || driverId.equals(WebServiceUtils.makeDriverFullId(driver))) {
                result.add(new WebDatabaseDriverConfig(webSession, driver));
            }
        }
        return result;
    }

    @Override
    public List<WebDataSourceConfig> getGlobalDataSources() throws DBWebException {

        List<WebDataSourceConfig> result = new ArrayList<>();
        DBPDataSourceRegistry dsRegistry = WebServiceUtils.getDataSourceRegistry();

        for (DBPDataSourceContainer ds : dsRegistry.getDataSources()) {
            if (CBPlatform.getInstance().getApplicableDrivers().contains(ds.getDriver()) && !ds.isProvided()) {
                result.add(new WebDataSourceConfig(ds));
            } else {
                log.debug("Global datasource '" + ds.getName() + "' ignored - driver is not applicable");
            }
        }

        return result;
    }

    @Override
    public String[] getSessionPermissions(WebSession webSession) throws DBWebException {
        try {
            return webSession.getSessionPermissions().toArray(new String[0]);
        } catch (DBCException e) {
            throw new DBWebException("Error reading session permissions", e);
        }
    }

    @Override
    public WebSession openSession(WebSession webSession) {
        return webSession;
    }

    @Override
    public WebSession getSessionState(WebSession webSession) {
        return webSession;
    }

    @Override
    public List<WebServerMessage> readSessionLog(WebSession webSession, Integer maxEntries, Boolean clearEntries) {
        return webSession.readLog(maxEntries, clearEntries);
    }

    @Override
    public boolean closeSession(HttpServletRequest request) {
        return CBPlatform.getInstance().getSessionManager().closeSession(request);
    }

    @Override
    public boolean touchSession(HttpServletRequest request) throws DBWebException {
        return CBPlatform.getInstance().getSessionManager().touchSession(request);
    }

    @Override
    public boolean changeSessionLanguage(WebSession webSession, String locale) {
        webSession.setLocale(locale);
        return true;
    }

}

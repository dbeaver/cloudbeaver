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
package io.cloudbeaver.model;

import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CloudbeaverConstants;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.meta.Property;

/**
 * Web connection info
 */
public class WebConnectionInfo {

    private final WebSession session;
    private DBPDataSourceContainer dataSourceContainer;
    private WebServerError connectError;

    private String connectTime;
    private String serverVersion;
    private String clientVersion;

    public WebConnectionInfo(WebSession session, DBPDataSourceContainer ds) {
        this.session = session;
        this.dataSourceContainer = ds;
    }

    public WebSession getSession() {
        return session;
    }

    public DBPDataSourceContainer getDataSourceContainer() {
        return dataSourceContainer;
    }

    public DBPDataSource getDataSource() {
        return dataSourceContainer.getDataSource();
    }

    @Property
    public String getId() {
        return dataSourceContainer.getId();
    }

    @Property
    public String getDriverId() {
        return WebServiceUtils.makeDriverFullId(dataSourceContainer.getDriver());
    }

    @Property
    public String getName() {
        return dataSourceContainer.getName();
    }

    @Property
    public String getDescription() {
        return dataSourceContainer.getDescription();
    }

    @Property
    public String getProperties() {
        return null;
    }

    @Property
    public boolean isConnected() {
        return dataSourceContainer.isConnected();
    }

    @Property
    public boolean isProvided() {
        return dataSourceContainer.isProvided();
    }

    @Property
    public String getConnectTime() {
        return CloudbeaverConstants.ISO_DATE_FORMAT.format(dataSourceContainer.getConnectTime());
    }

    @Property
    public WebServerError getConnectError() {
        return connectError;
    }

    public void setConnectError(Throwable connectError) {
        this.connectError = connectError == null ? null : new WebServerError(connectError);
    }

    public void setConnectTime(String connectTime) {
        this.connectTime = connectTime;
    }

    public String getServerVersion() {
        return serverVersion;
    }

    public void setServerVersion(String serverVersion) {
        this.serverVersion = serverVersion;
    }

    public String getClientVersion() {
        return clientVersion;
    }

    public void setClientVersion(String clientVersion) {
        this.clientVersion = clientVersion;
    }

}

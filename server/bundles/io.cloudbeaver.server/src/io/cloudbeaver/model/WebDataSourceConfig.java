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

import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.meta.Property;

/**
 * Web data source configuration
 */
public class WebDataSourceConfig {

    private String id;
    private String driverId;
    private String name;
    private String description;

    private String host;
    private String server;
    private String port;
    private String url;
    private String properties;

    public WebDataSourceConfig(DBPDataSourceContainer ds) {
        this.id = ds.getId();
        this.name = ds.getName();
        this.description = ds.getDescription();
        this.driverId = ds.getDriver().getFullId();
        this.host = ds.getConnectionConfiguration().getHostName();
        this.port = ds.getConnectionConfiguration().getHostPort();
        this.url = ds.getConnectionConfiguration().getUrl();
    }

    @Property
    public String getId() {
        return id;
    }

    @Property
    public String getDriverId() {
        return driverId;
    }

    @Property
    public String getName() {
        return name;
    }

    @Property
    public String getDescription() {
        return description;
    }

    @Property
    public String getHost() {
        return host;
    }

    @Property
    public String getServer() {
        return server;
    }

    @Property
    public String getPort() {
        return port;
    }

    @Property
    public String getUrl() {
        return url;
    }

    @Property
    public String getProperties() {
        return properties;
    }
}

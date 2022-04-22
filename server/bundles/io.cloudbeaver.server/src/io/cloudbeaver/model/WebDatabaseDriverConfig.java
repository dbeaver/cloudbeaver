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
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.ConfigurationUtils;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.connection.DBPAuthModelDescriptor;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNative;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.network.NetworkHandlerDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerRegistry;
import org.jkiss.dbeaver.runtime.properties.PropertySourceCustom;
import org.jkiss.utils.CommonUtils;

import java.util.Arrays;
import java.util.Map;

/**
 * Web driver configuration
 */
public class WebDatabaseDriverConfig {

    public static final String URL_SERVER_FIELD = "{server}";
    private final WebSession webSession;
    private final DBPDriver driver;
    private String id;

    public WebDatabaseDriverConfig(WebSession webSession, DBPDriver driver) {
        this.webSession = webSession;
        this.driver = driver;
        this.id = driver.getFullId();
    }

    @Property
    public String getId() {
        return id;
    }

    @Property
    public String getName() {
        return driver.getName();
    }

    @Property
    public String getDescription() {
        return driver.getDescription();
    }

    @Property
    public String getIcon() {
        return WebServiceUtils.makeIconId(driver.getIcon());
    }

    @Property
    public String getIconBig() {
        return WebServiceUtils.makeIconId(driver.getIconBig());
    }

    @Property
    public String getProviderId() {
        return driver.getProviderId();
    }

    @Property
    public String getDriverClassName() {
        return driver.getDriverClassName();
    }

    @Property
    public String getDefaultHost() {
        return CommonUtils.toString(driver.getDefaultHost(), DBConstants.HOST_LOCALHOST);
    }

    @Property
    public String getDefaultPort() {
        return driver.getDefaultPort();
    }

    @Property
    public String getDefaultDatabase() {
        return driver.getDefaultDatabase();
    }

    @Property
    public String getDefaultServer() {
        // defaultHost and defaultServer are different properties
        return getDefaultHost();
    }

    @Property
    public String getDefaultUser() {
        return driver.getDefaultUser();
    }

    @Property
    public String getSampleURL() {
        return driver.getSampleURL();
    }

    @Property
    public String getDriverInfoURL() {
        return driver.getWebURL();
    }

    @Property
    public String getDriverPropertiesURL() {
        return driver.getPropertiesWebURL();
    }

    @Property
    public boolean getEmbedded() {
        return driver.isEmbedded();
    }

    @Property
    public boolean getAnonymousAccess() {
        return driver.isAnonymousAccess();
    }

    @Property
    public boolean getAllowsEmptyPassword() {
        return driver.isAllowsEmptyPassword();
    }

    @Property
    public boolean getLicenseRequired() {
        return driver.isLicenseRequired();
    }

    @Property
    public String getLicense() {
        return driver.getLicense();
    }

    @Property
    public boolean getCustom() {
        return driver.isCustom();
    }

    @Property
    public int getPromotedScore() {
        return driver.getPromotedScore();
    }

    @Property
    public Map<String, Object> getConnectionProperties() {
        return driver.getConnectionProperties();
    }

    @Property
    public Map<String, Object> getDefaultConnectionProperties() {
        return driver.getDefaultConnectionProperties();
    }

    @Property
    public WebPropertyInfo[] getDriverProperties() throws DBWebException {
        try {
            DBPConnectionConfiguration cfg = new DBPConnectionConfiguration();
            cfg.setUrl(driver.getSampleURL());
            cfg.setHostName(DBConstants.HOST_LOCALHOST);
            cfg.setHostPort(driver.getDefaultPort());
            cfg.setUrl(driver.getConnectionURL(cfg));
            DBPPropertyDescriptor[] properties = driver.getDataSourceProvider().getConnectionProperties(webSession.getProgressMonitor(), driver, cfg);
            if (properties == null) {
                return new WebPropertyInfo[0];
            }

            PropertySourceCustom propertySource = new PropertySourceCustom(
                properties,
                cfg.getProperties());

            return Arrays.stream(properties)
                .map(p -> new WebPropertyInfo(webSession, p, propertySource)).toArray(WebPropertyInfo[]::new);
        } catch (DBException e) {
            throw new DBWebException("Error reading driver properties", e);
        }
    }

    @Property
    public Map<String, Object> getDriverParameters() {
        return driver.getDriverParameters();
    }

    @Property
    public String[] getApplicableAuthModels() {
        return DataSourceProviderRegistry.getInstance().getApplicableAuthModels(driver).stream()
            .filter(s -> !s.isDesktopModel())
            .map(DBPAuthModelDescriptor::getId).toArray(String[]::new);
    }

    @Property
    public String[] getApplicableNetworkHandlers() {
        if (driver.isEmbedded()) {
            return new String[0];
        }
        return NetworkHandlerRegistry.getInstance().getDescriptors(driver).stream()
            .map(NetworkHandlerDescriptor::getId).toArray(String[]::new);
    }

    @Property
    public String getDefaultAuthModel() {
        for (DBPAuthModelDescriptor am : DataSourceProviderRegistry.getInstance().getApplicableAuthModels(driver)) {
            if (am.isDefaultModel()) {
                return am.getId();
            }
        }
        return AuthModelDatabaseNative.ID;
    }

    @Property
    public WebPropertyInfo[] getProviderProperties() {
        return Arrays.stream(driver.getProviderPropertyDescriptors())
            .map(p -> new WebPropertyInfo(webSession, p, null))
            .toArray(WebPropertyInfo[]::new);
    }

    @Property
    public boolean isEnabled() {
        return ConfigurationUtils.isDriverEnabled(driver);
    }

    @Property
    public boolean getRequiresServerName() {
        if (driver.getSampleURL() == null) {
            return false;
        }
        return driver.getSampleURL().contains(URL_SERVER_FIELD);
    }
}

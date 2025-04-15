/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
import io.cloudbeaver.model.app.WebAppConfiguration;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.utils.ConfigurationUtils;
import io.cloudbeaver.server.WebAppUtils;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.connection.*;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNative;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.network.NetworkHandlerDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerRegistry;
import org.jkiss.dbeaver.runtime.properties.PropertySourceCustom;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Web driver configuration
 */
public class WebDatabaseDriverInfo {

    private static final Log log = Log.getLog(WebDatabaseDriverInfo.class);
    public static final String URL_SERVER_FIELD = "{server}";
    public static final String URL_DATABASE_FIELD = ".*(?:\\{(?:database|file|folder)}).*";
    private final WebSession webSession;
    private final DBPDriver driver;
    private final String id;

    public WebDatabaseDriverInfo(WebSession webSession, DBPDriver driver) {
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
    public String getDriverId() {
        return driver.getId();
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
            cfg.setUrl(CommonUtils.notEmpty(driver.getSampleURL()));
            cfg.setHostName(DBConstants.HOST_LOCALHOST);
            cfg.setHostPort(driver.getDefaultPort());
            cfg.setDatabaseName(driver.getDefaultDatabase());
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
            log.error("Error reading driver properties:\n" + e.getMessage());
            return new WebPropertyInfo[0];
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
        if (!driver.isEmbedded() || CommonUtils.toBoolean(driver.getDriverParameter(DBConstants.DRIVER_PARAM_ENABLE_NETWORK_PARAMETERS))) {
            return NetworkHandlerRegistry.getInstance().getDescriptors(driver).stream()
                .filter(h -> !h.isDesktopHandler())
                .map(NetworkHandlerDescriptor::getId).toArray(String[]::new);
        }
        return new String[0];
    }

    @Property
    public String getDefaultAuthModel() {
        for (DBPAuthModelDescriptor am : DataSourceProviderRegistry.getInstance().getApplicableAuthModels(driver)) {
            if (!am.isDesktopModel() && am.isDefaultModel()) {
                return am.getId();
            }
        }
        return AuthModelDatabaseNative.ID;
    }

    @Property
    public WebPropertyInfo[] getMainProperties() {
        DBPPropertyDescriptor[] properties = driver.getMainPropertyDescriptors();
        // set default values to main properties
        Map<String, String> defaultValues = new LinkedHashMap<>();
        defaultValues.put(DBConstants.PROP_HOST, getDefaultHost());
        defaultValues.put(DBConstants.PROP_PORT, getDefaultPort());
        defaultValues.put(DBConstants.PROP_DATABASE, getDefaultDatabase());
        defaultValues.put(DBConstants.PROP_SERVER, getDefaultServer());
        PropertySourceCustom propertySource = new PropertySourceCustom(properties, defaultValues);

        return Arrays.stream(properties)
            .map(p -> new WebPropertyInfo(webSession, p, propertySource))
            .toArray(WebPropertyInfo[]::new);
    }

    @Property
    public WebPropertyInfo[] getProviderProperties() {
        WebPropertyInfo[] additionalWebProperty = Optional.of(WebAppUtils.getWebApplication())
            .filter(app -> app.getAppConfiguration().isSecretManagerEnabled())
            .map(app -> app.getConnectionController().getExternalInfo(webSession))
            .orElse(new WebPropertyInfo[0]);

        WebPropertyInfo[] providerProperties = Arrays.stream(driver.getProviderPropertyDescriptors())
            .map(p -> new WebPropertyInfo(webSession, p, null))
            .toArray(WebPropertyInfo[]::new);

        return Stream.concat(
            Arrays.stream(additionalWebProperty),
            Arrays.stream(providerProperties)
        ).toArray(WebPropertyInfo[]::new);
    }

    @Property
    public boolean isEnabled() {
        WebAppConfiguration config = WebAppUtils.getWebApplication().getAppConfiguration();
        return ConfigurationUtils.isDriverEnabled(
            driver,
            config.getEnabledDrivers(),
            config.getDisabledDrivers()
            );
    }

    @Property
    public boolean getRequiresServerName() {
        return driver.getSupportedPageFields().contains(DBConstants.PROP_SERVER) ||
            (driver.getSampleURL() != null && driver.getSampleURL().contains(URL_SERVER_FIELD));
    }

    @Property
    public DBPDriverConfigurationType[] getConfigurationTypes() {
        return driver.getSupportedConfigurationTypes().toArray(DBPDriverConfigurationType[]::new);
    }


    @Property
    public boolean getRequiresDatabaseName() {
        if (driver.getSampleURL() == null) {
            return false;
        }
        return driver.getSampleURL().matches(URL_DATABASE_FIELD);
    }

    @Property
    public WebDriverLibraryInfo[] getDriverLibraries() {
        return driver.getDriverLibraries().stream()
            .filter(library -> !library.isDisabled())
            .map(library -> new WebDriverLibraryInfo(driver, library))
            .toArray(WebDriverLibraryInfo[]::new);
    }

    @Property
    public boolean isDriverInstalled() {
        return driver.getDefaultDriverLoader().isDriverInstalled();
    }

    @Property
    public boolean isDownloadable() {
        return driver.getDriverLibraries().stream().anyMatch(DBPDriverLibrary::isDownloadable);
    }

    @Property
    public boolean getUseCustomPage() {
        return !ArrayUtils.isEmpty(driver.getMainPropertyDescriptors());
    }

    @Property
    public boolean isSafeEmbeddedDriver() {
        return CommonUtils.toBoolean(driver.getDriverParameter(DBConstants.PARAM_SAFE_EMBEDDED_DRIVER));
    }
}

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
package io.cloudbeaver.model.app;

import io.cloudbeaver.DataSourceFilter;
import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.log.SLF4JLogHandler;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebGlobalWorkspace;
import org.eclipse.core.resources.IWorkspace;
import org.eclipse.core.runtime.Platform;
import org.eclipse.equinox.app.IApplicationContext;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPPlatform;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.impl.app.ApplicationRegistry;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.websocket.event.WSEventController;
import org.jkiss.dbeaver.registry.BaseApplicationImpl;
import org.jkiss.dbeaver.runtime.IVariableResolver;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.RuntimeUtils;
import org.jkiss.utils.CommonUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

/**
 * Web application
 */
public abstract class BaseWebApplication extends BaseApplicationImpl implements WebApplication {

    public static final String DEFAULT_CONFIG_FILE_PATH = "/etc/cloudbeaver.conf";
    public static final String CLI_PARAM_WEB_CONFIG = "-web-config";


    private static final Log log = Log.getLog(BaseWebApplication.class);

    @NotNull
    @Override
    public DBPWorkspace createWorkspace(@NotNull DBPPlatform platform, @NotNull IWorkspace eclipseWorkspace) {
        return new WebGlobalWorkspace(platform, eclipseWorkspace);
    }

    @Override
    public RMController createResourceController(@NotNull SMCredentialsProvider credentialsProvider, @NotNull DBPWorkspace workspace) {
        throw new IllegalStateException("Resource controller is not supported by " + getClass().getSimpleName());
    }

    @Nullable
    @Override
    public Path getDefaultWorkingFolder() {
        return null;
    }

    @Override
    public boolean isHeadlessMode() {
        return true;
    }

    @Override
    public boolean isMultiuser() {
        return true;
    }

    @Nullable
    protected Path loadServerConfiguration() throws DBException {
        String configPath = DEFAULT_CONFIG_FILE_PATH;

        String[] args = Platform.getCommandLineArgs();
        for (int i = 0; i < args.length; i++) {
            if (args[i].equals(CLI_PARAM_WEB_CONFIG) && args.length > i + 1) {
                configPath = args[i + 1];
                break;
            }
        }
        Path path = Path.of(configPath).toAbsolutePath();

        // Configure logging
        Path logbackConfigPath = null;
        for (Path confFolder = path.getParent(); confFolder != null; confFolder = confFolder.getParent()) {
            Path lbFile = confFolder.resolve("logback.xml");
            if (Files.exists(lbFile)) {
                logbackConfigPath = lbFile;
                break;
            }
        }

        if (logbackConfigPath == null) {
            System.err.println("Can't find slf4j configuration file in " + path.getParent());
        } else {
            System.setProperty("logback.configurationFile", logbackConfigPath.toString());
        }
        Log.setLogHandler(new SLF4JLogHandler());

        // Load config file
        log.debug("Loading configuration from " + path);
        try {
            loadConfiguration(configPath);
        } catch (Exception e) {
            log.error("Error parsing configuration", e);
            return null;
        }

        return path;
    }

    protected abstract void loadConfiguration(String configPath) throws DBException;

    @Override
    public WebProjectImpl createProjectImpl(
        @NotNull WebSession webSession,
        @NotNull RMProject project,
        @NotNull DataSourceFilter dataSourceFilter
    ) {
        return new WebProjectImpl(
            webSession.getWorkspace(),
            webSession.getRmController(),
            webSession.getSessionContext(),
            project,
            dataSourceFilter
        );
    }

    /**
     * There is no secret controller in base web app.
     * Method returns VoidSecretController instance.
     * Advanced apps may implement it differently.
     */
    @Override
    public DBSSecretController getSecretController(@NotNull SMCredentialsProvider credentialsProvider)  throws DBException {
        return VoidSecretController.INSTANCE;
    }

    protected Map<String, Object> getServerConfigProps(Map<String, Object> configProps) {
        return JSONUtils.getObject(configProps, "server");
    }

    @SuppressWarnings("unchecked")
    public static void patchConfigurationWithProperties(Map<String, Object> configProps, IVariableResolver varResolver) {
        for (Map.Entry<String, Object> entry : configProps.entrySet()) {
            Object propValue = entry.getValue();
            if (propValue instanceof String) {
                entry.setValue(GeneralUtils.replaceVariables((String) propValue, varResolver));
            } else if (propValue instanceof Map) {
                patchConfigurationWithProperties((Map<String, Object>) propValue, varResolver);
            } else if (propValue instanceof List) {
                List value = (List) propValue;
                for (int i = 0; i < value.size(); i++) {
                    Object colItem = value.get(i);
                    if (colItem instanceof String) {
                        value.set(i, GeneralUtils.replaceVariables((String) colItem, varResolver));
                    } else if (colItem instanceof Map) {
                        patchConfigurationWithProperties((Map<String, Object>) colItem, varResolver);
                    }
                }
            }
        }
    }

    @Override
    public Object start(IApplicationContext context) {
        try {
            startServer();
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
        return null;
    }

    protected abstract void startServer() throws DBException;

    @Override
    public String getApplicationInstanceId() throws DBException {
        try {
            byte[] macAddress = RuntimeUtils.getLocalMacAddress();
            String appId = ApplicationRegistry.getInstance().getApplication().getId();
            return appId + "_" + CommonUtils.toHexString(macAddress) + getServerPort();
        } catch (Exception e) {
            throw new DBException("Error during generation instance id generation", e);
        }
    }

    public String getApplicationId() {
        try {
            return getApplicationInstanceId();
        } catch (DBException e) {
            return null;
        }
    }

    @Override
    public WSEventController getEventController() {
        return null;
    }
}

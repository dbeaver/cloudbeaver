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
package io.cloudbeaver.model.app;

import io.cloudbeaver.model.log.SLF4JLogHandler;
import org.eclipse.core.runtime.Platform;
import org.eclipse.equinox.app.IApplicationContext;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBFileController;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.impl.app.ApplicationRegistry;
import org.jkiss.dbeaver.model.impl.app.BaseApplicationImpl;
import org.jkiss.dbeaver.model.impl.app.BaseWorkspaceImpl;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.websocket.event.WSEventController;
import org.jkiss.dbeaver.runtime.IVariableResolver;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.RuntimeUtils;
import org.jkiss.utils.CommonUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

/**
 * Servlet application
 */
public abstract class BaseServletApplication extends BaseApplicationImpl implements ServletApplication {

    public static final String DEFAULT_CONFIG_FILE_PATH = "/etc/cloudbeaver.conf";
    public static final String CUSTOM_CONFIG_FOLDER = "custom";
    public static final String CLI_PARAM_WEB_CONFIG = "-web-config";
    public static final String LOGBACK_FILE_NAME = "logback.xml";

    private static final Log log = Log.getLog(BaseServletApplication.class);

    private String instanceId;

    @Override
    public RMController createResourceController(
        @NotNull SMCredentialsProvider credentialsProvider,
        @NotNull DBPWorkspace workspace
    ) throws DBException {
        throw new IllegalStateException("Resource controller is not supported by " + getClass().getSimpleName());
    }

    @NotNull
    @Override
    public DBFileController createFileController(@NotNull SMCredentialsProvider credentialsProvider) {
        throw new IllegalStateException("File controller is not supported by " + getClass().getSimpleName());
    }

    @Nullable
    @Override
    public Path getDefaultWorkingFolder() {
        return getServerConfigurationController().getWorkspacePath();
    }

    @Override
    public boolean isHeadlessMode() {
        return true;
    }

    @Override
    public boolean isMultiuser() {
        return true;
    }

    protected boolean loadServerConfiguration() throws DBException {
        Path configFilePath = getMainConfigurationFilePath().toAbsolutePath();

        Log.setLogHandler(new SLF4JLogHandler());

        // Load config file
        log.debug("Loading configuration from " + configFilePath);
        try {
            getServerConfigurationController().loadServerConfiguration(configFilePath);
        } catch (Exception e) {
            log.error("Error parsing configuration", e);
            return false;
        }

        return true;
    }

    @Nullable
    private Path getLogbackConfigPath(Path path) {
        // try to find custom logback.xml file
        Path logbackConfigPath = getCustomConfigPath(path, LOGBACK_FILE_NAME);
        if (Files.exists(logbackConfigPath)) {
            return logbackConfigPath;
        }
        for (Path confFolder = path; confFolder != null; confFolder = confFolder.getParent()) {
            Path lbFile = confFolder.resolve(LOGBACK_FILE_NAME);
            if (Files.exists(lbFile)) {
                return lbFile;
            }
        }
        return null;
    }

    public Path getLogbackConfigPath() {
        Path configFilePath = getMainConfigurationFilePath().toAbsolutePath();
        Path configFolder = configFilePath.getParent();

        // Configure logging
        return getLogbackConfigPath(configFolder);
    }

    protected Path getMainConfigurationFilePath() {
        String configPath = DEFAULT_CONFIG_FILE_PATH;

        String[] args = Platform.getCommandLineArgs();
        for (int i = 0; i < args.length; i++) {
            if (args[i].equals(CLI_PARAM_WEB_CONFIG) && args.length > i + 1) {
                configPath = args[i + 1];
                break;
            }
        }
        // try fo find custom config path (it is used mostly for docker volumes)
        Path configFilePath = Path.of(configPath);

        Path customConfigPath = getCustomConfigPath(configFilePath.getParent(), configFilePath.getFileName().toString());
        if (Files.exists(customConfigPath)) {
            return customConfigPath;
        }
        return configFilePath;
    }

    @NotNull
    private Path getCustomConfigPath(Path configPath, String fileName) {
        var customConfigPath = configPath.resolve(CUSTOM_CONFIG_FOLDER).resolve(fileName);
        return Files.exists(customConfigPath) ? customConfigPath : configPath.resolve(fileName);
    }

    /**
     * There is no secret controller in base web app.
     * Method returns VoidSecretController instance.
     * Advanced apps may implement it differently.
     */
    @Override
    public DBSSecretController getSecretController(
        @NotNull SMCredentialsProvider credentialsProvider,
        SMSessionContext smSessionContext
    ) throws DBException {
        return VoidSecretController.INSTANCE;
    }

    public static Map<String, Object> getServerConfigProps(Map<String, Object> configProps) {
        return JSONUtils.getObject(configProps, "server");
    }

    @SuppressWarnings("unchecked")
    public static void patchConfigurationWithProperties(
        Map<String, Object> configProps, IVariableResolver varResolver
    ) {
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
        initializeApplicationServices();
        try {
            startServer();
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
        return null;
    }

    protected abstract void startServer() throws DBException;

    @Override
    public synchronized String getApplicationInstanceId() throws DBException {
        if (instanceId == null) {
            try {
                byte[] macAddress = RuntimeUtils.getLocalMacAddress();
                instanceId = String.join(
                    "_",
                    ApplicationRegistry.getInstance().getApplication().getId(),
                    getWorkspaceIdProperty(), // workspace id is read from property file
                    CommonUtils.toHexString(macAddress),
                    CommonUtils.toString(getServerPort())
                );
            } catch (Exception e) {
                throw new DBException("Error during generation instance id generation", e);
            }
        }
        return instanceId;
    }

    @NotNull
    public String getWorkspaceIdProperty() throws DBException {
        return BaseWorkspaceImpl.readWorkspaceIdProperty();
    }

    @Override
    public Path getWorkspaceDirectory() {
        return getServerConfigurationController().getWorkspacePath();
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

    public abstract ServletServerConfigurationController getServerConfigurationController();

    @Override
    public boolean isEnvironmentVariablesAccessible() {
        return false;
    }

    protected void closeResource(String name, Runnable closeFunction) {
        try {
            closeFunction.run();
        } catch (Exception e) {
            log.error("Failed close " + name, e);
        }
    }
}

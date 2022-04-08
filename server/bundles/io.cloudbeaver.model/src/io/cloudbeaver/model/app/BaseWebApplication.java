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
package io.cloudbeaver.model.app;

import org.eclipse.core.runtime.Platform;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.registry.BaseApplicationImpl;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Web application
 */
public abstract class BaseWebApplication extends BaseApplicationImpl {

    public static final String DEFAULT_CONFIG_FILE_PATH = "/etc/cloudbeaver.conf";
    public static final String CLI_PARAM_WEB_CONFIG = "-web-config";


    private static final Log log = Log.getLog(BaseWebApplication.class);

    @Nullable
    protected Path loadServerConfiguration() {
        String configPath = DEFAULT_CONFIG_FILE_PATH;

        String[] args = Platform.getCommandLineArgs();
        for (int i = 0; i < args.length; i++) {
            if (args[i].equals(CLI_PARAM_WEB_CONFIG) && args.length > i + 1) {
                configPath = args[i + 1];
                break;
            }
        }
        Path path = Path.of(configPath);
        // Configure logging
        Path logbackConfigPath = null;
        for (Path confFolder = path.getParent(); confFolder != null; confFolder = confFolder.getParent()) {
            Path lbFile = confFolder.resolve("logback.xml").toAbsolutePath();
            if (Files.exists(lbFile)) {
                logbackConfigPath = lbFile;
                break;
            }
        }

        if (logbackConfigPath == null) {
            System.err.println("Can't find slf4j configuration file in " + path.getParent().toAbsolutePath().toString());
        } else {
            System.setProperty("logback.configurationFile", logbackConfigPath.toString());
        }

        // Load config file
        try {
            loadConfiguration(configPath);
        } catch (Exception e) {
            log.error("Error parsing configuration", e);
            return null;
        }

        return path;
    }

    protected abstract void loadConfiguration(String configPath);

}

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
package io.cloudbeaver.slf4j;

import ch.qos.logback.classic.spi.LogbackServiceProvider;
import org.slf4j.helpers.Reporter;

import java.nio.file.Files;
import java.nio.file.Path;

public class CloudBeaverLogServiceProvider extends LogbackServiceProvider {
    private static final String LOGBACK_CONF_FILE_PROPERTY = "logback.configurationFile";
    private static final String MAIN_LOGBACK_CONFIG = "conf/logback.xml";
    private static final String CUSTOM_LOGBACK_CONFIG = "conf/custom/logback.xml";


    public CloudBeaverLogServiceProvider() {
        if (System.getProperty(LOGBACK_CONF_FILE_PROPERTY) != null) {
            return;
        }

        String logbackConfig = null;
        if (Files.exists(Path.of(CUSTOM_LOGBACK_CONFIG))) {
            logbackConfig = CUSTOM_LOGBACK_CONFIG;
        } else if (Files.exists(Path.of(MAIN_LOGBACK_CONFIG))) {
            logbackConfig = MAIN_LOGBACK_CONFIG;
        }

        if (logbackConfig != null) {
            System.setProperty(LOGBACK_CONF_FILE_PROPERTY, Path.of(logbackConfig).toString());
            Reporter.info("Logback configuration is used: " + logbackConfig);
        } else {
            Reporter.info("No logback configuration found");
        }
    }
}

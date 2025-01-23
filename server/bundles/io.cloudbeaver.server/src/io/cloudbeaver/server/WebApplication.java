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
package io.cloudbeaver.server;

import io.cloudbeaver.model.WebServerConfig;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.app.WebAppConfiguration;
import io.cloudbeaver.model.app.WebServerConfiguration;
import io.cloudbeaver.registry.WebDriverRegistry;
import io.cloudbeaver.service.ConnectionController;
import org.jkiss.code.NotNull;

import java.net.InetAddress;
import java.util.List;
import java.util.Map;

/**
 * Base interface for applications with web ui
 */
public interface WebApplication extends ServletApplication {
    WebServerConfiguration getServerConfiguration();

    WebAppSessionManager getSessionManager();

    WebDriverRegistry getDriverRegistry();

    WebAppConfiguration getAppConfiguration();

    @NotNull
    Map<String, Object> getProductConfiguration();

    List<InetAddress> getLocalInetAddresses();

    Map<String, String> getInitActions();

    boolean isLicenseValid();

    String getLicenseStatus();

    WebServerConfig getWebServerConfig();

    ConnectionController getConnectionController();

}

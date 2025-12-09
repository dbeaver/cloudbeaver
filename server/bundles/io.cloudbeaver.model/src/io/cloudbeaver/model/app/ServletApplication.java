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
package io.cloudbeaver.model.app;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBFileController;
import org.jkiss.dbeaver.model.app.DBPApplication;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.websocket.event.WSEventController;

import java.nio.file.Path;
import java.util.Map;

/**
 * Base interface for web application
 */
public interface ServletApplication extends DBPApplication {
    boolean isConfigurationMode();

    default boolean isInitializationMode() {
        return false;
    }

    @NotNull
    ServletAppConfiguration getAppConfiguration();

    @NotNull
    ServletServerConfiguration getServerConfiguration();

    @NotNull
    Path getDataDirectory(boolean create);

    @NotNull
    Path getWorkspaceDirectory();

    @NotNull
    Path getHomeDirectory();

    boolean isMultiNode();

    SMController createSecurityController(@NotNull SMCredentialsProvider credentialsProvider) throws DBException;

    SMAdminController getAdminSecurityController(@NotNull SMCredentialsProvider credentialsProvider) throws DBException;

    @NotNull
    DBSSecretController getSecretController(
        @NotNull SMCredentialsProvider credentialsProvider,
        SMSessionContext smSessionContext
    ) throws DBException;

    @NotNull
    RMController createResourceController(
        @NotNull SMCredentialsProvider credentialsProvider,
        @NotNull DBPWorkspace workspace
    ) throws DBException;

    @NotNull
    DBFileController createFileController(@NotNull SMCredentialsProvider credentialsProvider);

    @Nullable
    String getServerURL();

    @NotNull
    default String getServicesURI() {
        return "/";
    }

    @NotNull
    default String getRootURI() {
        return "";
    }

    @NotNull
    String getApplicationInstanceId() throws DBException;

    @NotNull
    WSEventController getEventController();

    /**
     * Port this server listens on
     */
    int getServerPort();

    boolean isLicenseRequired();

    /**
     * Collector that contains information about system.
     */
    @Nullable
    ServletSystemInformationCollector<?> getSystemInformationCollector();

    default void getStatusInfo(@NotNull Map<String, Object> infoMap) {

    }

    boolean isAnonymousAccessEnabled();
}

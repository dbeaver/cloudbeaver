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

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.app.DBPApplication;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMController;

import java.nio.file.Path;

/**
 * Base interface for web application
 */
public interface WebApplication extends DBPApplication {
    boolean isConfigurationMode();

    WebAppConfiguration getAppConfiguration();

    Path getDataDirectory(boolean create);

    Path getHomeDirectory();

    boolean isMultiNode();

    SMController getSecurityController(@NotNull SMCredentialsProvider credentialsProvider);

    SMAdminController getAdminSecurityController(@NotNull SMCredentialsProvider credentialsProvider);

    RMController getResourceController(@NotNull SMCredentialsProvider credentialsProvider);

}

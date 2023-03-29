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
package io.cloudbeaver.server;

import io.cloudbeaver.auth.NoAuthCredentialsProvider;
import io.cloudbeaver.model.rm.local.LocalResourceController;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.service.security.CBEmbeddedSecurityController;
import io.cloudbeaver.service.security.EmbeddedSecurityControllerFactory;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMController;

import java.util.List;

public class CBApplicationCE extends CBApplication {
    private static final Log log = Log.getLog(CBApplicationCE.class);

    @Override
    public SMController createSecurityController(@NotNull SMCredentialsProvider credentialsProvider) throws DBException {
        return new EmbeddedSecurityControllerFactory().createSecurityService(
            this,
            databaseConfiguration,
            credentialsProvider,
            securityManagerConfiguration
        );
    }
    @Override
    public SMAdminController getAdminSecurityController(@NotNull SMCredentialsProvider credentialsProvider) throws DBException {
        return new EmbeddedSecurityControllerFactory().createSecurityService(
            this,
            databaseConfiguration,
            credentialsProvider,
            securityManagerConfiguration
        );
    }

    protected SMAdminController createGlobalSecurityController() throws DBException {
        return new EmbeddedSecurityControllerFactory().createSecurityService(
            this,
            databaseConfiguration,
            new NoAuthCredentialsProvider(),
            securityManagerConfiguration
        );
    }

    @Override
    public RMController createResourceController(@NotNull SMCredentialsProvider credentialsProvider, @NotNull DBPWorkspace workspace) {
        return LocalResourceController.builder(credentialsProvider, workspace, this::getSecurityController).build();
    }

    protected void shutdown() {
        try {
            if (securityController instanceof CBEmbeddedSecurityController) {
                ((CBEmbeddedSecurityController) securityController).shutdown();
            }
        } catch (Exception e) {
            log.error(e);
        }
        super.shutdown();
    }

    protected void finishSecurityServiceConfiguration(
        @NotNull String adminName,
        @Nullable String adminPassword,
        @NotNull List<WebAuthInfo> authInfoList
    ) throws DBException {
        if (securityController instanceof CBEmbeddedSecurityController) {
            ((CBEmbeddedSecurityController) securityController).finishConfiguration(adminName, adminPassword, authInfoList);
        }
    }
}

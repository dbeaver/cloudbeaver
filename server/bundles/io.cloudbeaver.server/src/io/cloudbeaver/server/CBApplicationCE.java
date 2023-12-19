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

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.InstanceCreator;
import io.cloudbeaver.service.security.db.WebDatabaseConfig;
import org.jkiss.dbeaver.model.auth.AuthInfo;
import io.cloudbeaver.auth.NoAuthCredentialsProvider;
import io.cloudbeaver.model.rm.local.LocalResourceController;
import io.cloudbeaver.service.security.CBEmbeddedSecurityController;
import io.cloudbeaver.service.security.EmbeddedSecurityControllerFactory;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBFileController;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.registry.LocalFileController;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class CBApplicationCE extends CBApplication {
    private static final Log log = Log.getLog(CBApplicationCE.class);

    protected final WebDatabaseConfig databaseConfiguration = new WebDatabaseConfig();

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
    protected void parseConfiguration(Map<String, Object> configProps) throws DBException {
        super.parseConfiguration(configProps);
        Gson gson = getGson();
        Map<String, Object> serverConfig = JSONUtils.getObject(configProps, "server");
        //DB config
        gson.fromJson(
            gson.toJsonTree(JSONUtils.getObject(serverConfig, CBConstants.PARAM_DB_CONFIGURATION)),
            WebDatabaseConfig.class
        );
    }

    @Override
    public RMController createResourceController(@NotNull SMCredentialsProvider credentialsProvider,
                                                 @NotNull DBPWorkspace workspace) throws DBException {
        return LocalResourceController.builder(credentialsProvider, workspace, this::getSecurityController).build();
    }

    @NotNull
    @Override
    public DBFileController createFileController(@NotNull SMCredentialsProvider credentialsProvider) {
        return new LocalFileController(DBWorkbench.getPlatform().getWorkspace().getAbsolutePath().resolve(DBFileController.DATA_FOLDER));
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
        @NotNull List<AuthInfo> authInfoList
    ) throws DBException {
        if (securityController instanceof CBEmbeddedSecurityController) {
            ((CBEmbeddedSecurityController) securityController).finishConfiguration(adminName, adminPassword, authInfoList);
        }
    }

    @NotNull
    @Override
    protected Map<String, Object> collectServerConfigProperties(String newServerName, String newServerURL, long sessionExpireTime, Map<String, Object> originServerConfig) {
        Map<String, Object> serverConfigProperties = super.collectServerConfigProperties(
            newServerName, newServerURL, sessionExpireTime, originServerConfig);

        var databaseConfigProperties = new LinkedHashMap<String, Object>();
        Map<String, Object> oldRuntimeDBConfig = JSONUtils.getObject(originServerConfig,
            CBConstants.PARAM_DB_CONFIGURATION);
        Gson gson = getGson();
        Map<String, Object> dbConfigMap = gson.fromJson(
            gson.toJsonTree(databaseConfiguration),
            JSONUtils.MAP_TYPE_TOKEN
        );
        if (!CommonUtils.isEmpty(dbConfigMap) && !isDistributed()) {
            for (Map.Entry<String, Object> mp : dbConfigMap.entrySet()) {
                copyConfigValue(oldRuntimeDBConfig, databaseConfigProperties, mp.getKey(), mp.getValue());
            }
            serverConfigProperties.put(CBConstants.PARAM_DB_CONFIGURATION, databaseConfigProperties);
        }
        return serverConfigProperties;
    }

    @Override
    protected GsonBuilder getGsonBuilder() {
        GsonBuilder gsonBuilder = super.getGsonBuilder();
        InstanceCreator<WebDatabaseConfig> dbConfigCreator = type -> databaseConfiguration;
        InstanceCreator<WebDatabaseConfig.Pool> dbPoolConfigCreator = type -> databaseConfiguration.getPool();
        return gsonBuilder
            .registerTypeAdapter(WebDatabaseConfig.class, dbConfigCreator)
            .registerTypeAdapter(WebDatabaseConfig.Pool.class, dbPoolConfigCreator);
    }
}

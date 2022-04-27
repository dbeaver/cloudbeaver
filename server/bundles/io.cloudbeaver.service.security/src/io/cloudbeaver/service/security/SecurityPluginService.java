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
package io.cloudbeaver.service.security;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.InstanceCreator;
import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.service.security.internal.CBEmbeddedSecurityController;
import io.cloudbeaver.service.security.internal.db.CBDatabase;
import io.cloudbeaver.service.security.internal.db.CBDatabaseConfig;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.runtime.IPluginService;

import java.util.List;
import java.util.Map;

public class SecurityPluginService implements IPluginService {
    private static final Log log = Log.getLog(SecurityPluginService.class);

    private static CBDatabase DB_INSTANCE;
    private static CBEmbeddedSecurityController CONTROLLER_INSTANCE;

    public static void finishConfiguration(String adminName, String adminPassword, List<WebAuthInfo> authInfoList) throws DBException {
        DB_INSTANCE.finishConfiguration(adminName, adminPassword, authInfoList);
    }

    @Override
    public void activateService() {

    }

    public static synchronized SMAdminController createSecurityService(WebApplication application, Map<String, Object> databaseConfig) throws DBException {
        if (CONTROLLER_INSTANCE != null) {
            return CONTROLLER_INSTANCE;
        }
        CBDatabaseConfig databaseConfiguration = new CBDatabaseConfig();
        InstanceCreator<CBDatabaseConfig> dbConfigCreator = type -> databaseConfiguration;
        InstanceCreator<CBDatabaseConfig.Pool> dbPoolConfigCreator = type -> databaseConfiguration.getPool();
        Gson gson = new GsonBuilder()
            .registerTypeAdapter(CBDatabaseConfig.class, dbConfigCreator)
            .registerTypeAdapter(CBDatabaseConfig.Pool.class, dbPoolConfigCreator)
            .create();
        gson.fromJson(gson.toJsonTree(databaseConfig), CBDatabaseConfig.class);

        DB_INSTANCE = new CBDatabase(application, databaseConfiguration);
        CONTROLLER_INSTANCE = new CBEmbeddedSecurityController(DB_INSTANCE);
        //FIXME circular dependency
        DB_INSTANCE.setAdminSecurityController(CONTROLLER_INSTANCE);

        DB_INSTANCE.initialize();
        CONTROLLER_INSTANCE.initializeMetaInformation();
        return CONTROLLER_INSTANCE;
    }

    @Override
    public void deactivateService() {
        if(DB_INSTANCE == null) {
            return;
        }
        try {
            DB_INSTANCE.shutdown();
        } catch (Exception e) {
            log.error(e);
        }
    }
}

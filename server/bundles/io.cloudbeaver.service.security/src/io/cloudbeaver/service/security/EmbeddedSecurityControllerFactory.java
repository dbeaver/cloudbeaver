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
import io.cloudbeaver.service.security.db.CBDatabase;
import io.cloudbeaver.service.security.db.CBDatabaseConfig;
import org.jkiss.dbeaver.DBException;

import java.util.Map;

/**
 * Embedded Security Controller Factory
 */
public class EmbeddedSecurityControllerFactory {

    /**
     * Create new security controller instance
     */
    public CBEmbeddedSecurityController createSecurityService(
        WebApplication application,
        Map<String, Object> databaseConfig
    ) throws DBException {
        CBDatabaseConfig databaseConfiguration = new CBDatabaseConfig();
        InstanceCreator<CBDatabaseConfig> dbConfigCreator = type -> databaseConfiguration;
        InstanceCreator<CBDatabaseConfig.Pool> dbPoolConfigCreator = type -> databaseConfiguration.getPool();
        Gson gson = new GsonBuilder()
            .registerTypeAdapter(CBDatabaseConfig.class, dbConfigCreator)
            .registerTypeAdapter(CBDatabaseConfig.Pool.class, dbPoolConfigCreator)
            .create();
        gson.fromJson(gson.toJsonTree(databaseConfig), CBDatabaseConfig.class);

        var database = new CBDatabase(application, databaseConfiguration);
        var securityController = createEmbeddedSecurityController(application, database);
        //FIXME circular dependency
        database.setAdminSecurityController(securityController);

        database.initialize();
        securityController.initializeMetaInformation();
        return securityController;
    }

    protected  CBEmbeddedSecurityController createEmbeddedSecurityController(WebApplication application, CBDatabase database) {
        return new CBEmbeddedSecurityController(application, database);
    }
}

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
package io.cloudbeaver.service.security;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.InstanceCreator;
import io.cloudbeaver.model.app.WebAuthApplication;
import io.cloudbeaver.service.security.db.CBDatabase;
import io.cloudbeaver.service.security.db.CBDatabaseConfig;
import io.cloudbeaver.service.security.internal.ClearAuthAttemptInfoJob;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;

import java.util.Map;

/**
 * Embedded Security Controller Factory
 */
public class EmbeddedSecurityControllerFactory<T extends WebAuthApplication> {
    private static volatile CBDatabase DB_INSTANCE;

    public static CBDatabase getDbInstance() {
        return DB_INSTANCE;
    }

    /**
     * Create new security controller instance with custom configuration
     */
    public CBEmbeddedSecurityController createSecurityService(
        T application,
        Map<String, Object> databaseConfig,
        SMCredentialsProvider credentialsProvider,
        SMControllerConfiguration smConfig
    ) throws DBException {
        boolean initDb = false;
        if (DB_INSTANCE == null) {
            synchronized (EmbeddedSecurityControllerFactory.class) {
                if (DB_INSTANCE == null) {
                    initDatabase(application, databaseConfig);
                    initDb = true;
                }
            }
        }
        var securityController = createEmbeddedSecurityController(
            application, DB_INSTANCE, credentialsProvider, smConfig
        );
        if (initDb) {
            //FIXME circular dependency
            DB_INSTANCE.setAdminSecurityController(securityController);
            DB_INSTANCE.initialize();
            securityController.initializeMetaInformation();
            if (application.isLicenseRequired()) {
                // delete expired auth info job in enterprise products
                new ClearAuthAttemptInfoJob(securityController).schedule();
            }
        }
        return securityController;
    }

    private synchronized void initDatabase(WebAuthApplication application, Map<String, Object> databaseConfig) {
        CBDatabaseConfig databaseConfiguration = new CBDatabaseConfig();
        InstanceCreator<CBDatabaseConfig> dbConfigCreator = type -> databaseConfiguration;
        InstanceCreator<CBDatabaseConfig.Pool> dbPoolConfigCreator = type -> databaseConfiguration.getPool();
        Gson gson = new GsonBuilder()
            .registerTypeAdapter(CBDatabaseConfig.class, dbConfigCreator)
            .registerTypeAdapter(CBDatabaseConfig.Pool.class, dbPoolConfigCreator)
            .create();
        gson.fromJson(gson.toJsonTree(databaseConfig), CBDatabaseConfig.class);

        DB_INSTANCE = new CBDatabase(application, databaseConfiguration);
    }

    protected CBEmbeddedSecurityController createEmbeddedSecurityController(
        T application,
        CBDatabase database,
        SMCredentialsProvider credentialsProvider,
        SMControllerConfiguration smConfig
    ) {
        return new CBEmbeddedSecurityController(application, database, credentialsProvider, smConfig);
    }
}

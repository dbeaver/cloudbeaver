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
package io.cloudbeaver.server;

import org.jkiss.code.Nullable;
import org.jkiss.utils.CommonUtils;

import java.util.LinkedHashMap;
import java.util.Map;

public class ConfigurationUtils {
    private ConfigurationUtils() {
    }

    public static Map<String, Object> databaseConfigToMap(@Nullable CBDatabaseConfig databaseConfiguration) {
        Map<String, Object> res = new LinkedHashMap<>();
        if (databaseConfiguration == null) {
            return res;
        }
        res.computeIfAbsent(
            CBDatabase.PARAM_DB_DRIVER_CONFIGURATION,
            v -> databaseConfiguration.getDriver()
        );
        res.computeIfAbsent(
            CBDatabase.PARAM_DB_URL_CONFIGURATION,
            v -> databaseConfiguration.getUrl()
        );
        res.computeIfAbsent(
            CBDatabase.PARAM_DB_USER_CONFIGURATION,
            v -> databaseConfiguration.getUser()
        );
        res.computeIfAbsent(
            CBDatabase.PARAM_DB_PW_CONFIGURATION,
            v -> databaseConfiguration.getPassword()
        );
        res.put(CBDatabase.PARAM_DB_CREATE_DATABASE_CONFIGURATION, databaseConfiguration.isCreateDatabase());
        res.put(CBDatabase.PARAM_DB_ALLOW_PUBLIC_ACCESS_CONFIGURATION, databaseConfiguration.isAllowPublicAccess());
        res.computeIfAbsent(
            CBDatabase.PARAM_DB_INITIAL_DATA_CONFIGURATION_CONFIGURATION,
            v -> databaseConfiguration.getInitialDataConfiguration()
        );
        Map<String, Object> poolMap = ConfigurationUtils.poolDatabaseConfigToMap(databaseConfiguration);
        if (!CommonUtils.isEmpty(poolMap)) {
            res.put(CBDatabase.PARAM_DB_POOL_CONFIGURATION, poolMap);
        }
        return res;
    }

    public static Map<String, Object> poolDatabaseConfigToMap(@Nullable CBDatabaseConfig databaseConfiguration) {
        Map<String, Object> res = new LinkedHashMap<>();
        if (databaseConfiguration == null) {
            return res;
        }
        CBDatabaseConfig.Pool pool = databaseConfiguration.getPool();
        if (pool == null) {
            return res;
        } else {
            res.put(CBDatabase.PARAM_DB_POOL_MIN_IDLE_CONNECTIONS_CONFIGURATION, pool.getMinIdleConnections());
            res.put(CBDatabase.PARAM_DB_POOL_MAX_IDLE_CONNECTIONS_CONFIGURATION, pool.getMaxIdleConnections());
            res.put(CBDatabase.PARAM_DB_POOL_MAX_CONNECTIONS_CONFIGURATION, pool.getMaxConnections());
            res.computeIfAbsent(
                CBDatabase.PARAM_DB_POOL_VALIDATION_QUERY_CONFIGURATION,
                v -> pool.getValidationQuery()
            );
        }
        return res;
    }
}

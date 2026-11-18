/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.service.dbadmin;

import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.dbadmin.impl.WebServiceDBAdmin;
import org.jkiss.utils.CommonUtils;

import java.util.List;

/**
 * Database administration service binding
 */
public class WebServiceBindingDBAdmin extends WebServiceBindingBase<DBWServiceDBAdmin> {

    private static final String SCHEMA_FILE_NAME = "schema/service.dbadmin.graphqls";

    public WebServiceBindingDBAdmin() {
        super(DBWServiceDBAdmin.class, new WebServiceDBAdmin(), SCHEMA_FILE_NAME);
    }

    @Override
    public void bindWiring(DBWBindingContext model) {
        model.getQueryType()
            .dataFetcher("dbAdminGetInfo", env -> getService(env).getInfo(getWebConnection(env)))
            .dataFetcher("dbAdminListSessions", env -> getService(env).listSessions(
                getWebConnection(env),
                CommonUtils.toBoolean(getArgument(env, "showIdle"))
            ))
            .dataFetcher("dbAdminListLocks", env -> getService(env).listLocks(getWebConnection(env)))
            .dataFetcher("dbAdminGetLockDetails", env -> getService(env).getLockDetails(
                getWebConnection(env),
                getArgumentVal(env, "lockId")
            ));
        model.getMutationType()
            .dataFetcher("dbAdminTerminateSessions", env -> {
                List<String> sessionIds = getArgumentVal(env, "sessionIds");
                return getService(env).terminateSessions(
                    getWebConnection(env),
                    sessionIds,
                    CommonUtils.toBoolean(getArgument(env, "cancelQueryOnly"))
                );
            })
            .dataFetcher("dbAdminTerminateLock", env -> getService(env).terminateLock(
                getWebConnection(env),
                getArgumentVal(env, "lockId")
            ));
    }
}

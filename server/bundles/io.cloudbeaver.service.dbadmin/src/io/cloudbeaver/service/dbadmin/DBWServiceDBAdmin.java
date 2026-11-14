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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.service.DBWService;
import io.cloudbeaver.service.dbadmin.model.*;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.util.List;

/**
 * Database server administration: sessions and locks.
 * Access follows connection access; the database account privileges limit what a user can see and terminate.
 */
public interface DBWServiceDBAdmin extends DBWService {

    @WebAction
    @NotNull
    WebDBAdminInfo getInfo(@NotNull WebConnectionInfo connection) throws DBWebException;

    @WebAction
    @NotNull
    WebDBAdminSessionList listSessions(@NotNull WebConnectionInfo connection, boolean showIdle) throws DBWebException;

    @WebAction
    boolean terminateSessions(
        @NotNull WebConnectionInfo connection,
        @NotNull List<String> sessionIds,
        boolean cancelQueryOnly
    ) throws DBWebException;

    @WebAction
    @NotNull
    WebDBAdminLockList listLocks(@NotNull WebConnectionInfo connection) throws DBWebException;

    @WebAction
    @NotNull
    WebDBAdminLockDetails getLockDetails(@NotNull WebConnectionInfo connection, @Nullable String lockId) throws DBWebException;

    @WebAction
    boolean terminateLock(@NotNull WebConnectionInfo connection, @Nullable String lockId) throws DBWebException;
}

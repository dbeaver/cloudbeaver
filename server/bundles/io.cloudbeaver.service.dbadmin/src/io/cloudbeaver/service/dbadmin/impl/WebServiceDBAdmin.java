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
package io.cloudbeaver.service.dbadmin.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.service.dbadmin.DBWServiceDBAdmin;
import io.cloudbeaver.service.dbadmin.model.*;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.ext.postgresql.model.PostgreDataSource;
import org.jkiss.dbeaver.ext.postgresql.model.lock.PostgreLock;
import org.jkiss.dbeaver.ext.postgresql.model.lock.PostgreLockItem;
import org.jkiss.dbeaver.ext.postgresql.model.lock.PostgreLockManager;
import org.jkiss.dbeaver.ext.postgresql.model.session.PostgreSessionManager;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPNamedObject;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.admin.sessions.DBAServerSession;
import org.jkiss.dbeaver.model.admin.sessions.DBAServerSessionManager;
import org.jkiss.dbeaver.model.exec.DBCSession;
import org.jkiss.dbeaver.model.impl.admin.locks.LockGraphManager;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.runtime.properties.ObjectPropertyDescriptor;
import org.jkiss.dbeaver.runtime.properties.PropertyCollector;
import org.jkiss.utils.CommonUtils;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Database administration service implementation.
 * <p>
 * Sessions use the {@link DBAServerSessionManager} adapter of the data source, so every database
 * whose DBeaver driver provides a session manager is supported.
 * Locks are supported for the PostgreSQL family (PostgreSQL, Greenplum, WarehousePG, ...).
 */
public class WebServiceDBAdmin implements DBWServiceDBAdmin {

    /** MySQL, Exasol and some other session managers use this option to cancel a query instead of killing a session */
    private static final String OPTION_KILL_QUERY = "killQuery";

    private static final DateTimeFormatter DATE_FORMAT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    @NotNull
    @Override
    public WebDBAdminInfo getInfo(@NotNull WebConnectionInfo connection) throws DBWebException {
        DBPDataSource dataSource = getConnectedDataSource(connection);
        return new WebDBAdminInfo(findSessionManager(dataSource) != null, findLockManager(dataSource) != null);
    }

    @NotNull
    @Override
    public WebDBAdminSessionList listSessions(@NotNull WebConnectionInfo connection, boolean showIdle) throws DBWebException {
        DBPDataSource dataSource = getConnectedDataSource(connection);
        DBAServerSessionManager<DBAServerSession> manager = getSessionManager(dataSource);
        DBRProgressMonitor monitor = connection.getSession().getProgressMonitor();
        try (DBCSession session = DBUtils.openMetaSession(monitor, dataSource, "Read server sessions")) {
            Collection<DBAServerSession> sessions = readSessions(manager, session, showIdle);
            List<WebDBAdminColumn> columns = new ArrayList<>();
            List<WebDBAdminSession> result = new ArrayList<>(sessions.size());
            for (DBAServerSession serverSession : sessions) {
                List<String> values = collectValues(monitor, serverSession, columns);
                result.add(new WebDBAdminSession(
                    CommonUtils.notEmpty(serverSession.getSessionId()),
                    serverSession.getActiveQuery(),
                    values
                ));
            }
            return new WebDBAdminSessionList(columns, result);
        } catch (DBException e) {
            throw new DBWebException("Error reading server sessions", e);
        }
    }

    @Override
    public boolean terminateSessions(
        @NotNull WebConnectionInfo connection,
        @NotNull List<String> sessionIds,
        boolean cancelQueryOnly
    ) throws DBWebException {
        DBPDataSource dataSource = getConnectedDataSource(connection);
        DBAServerSessionManager<DBAServerSession> manager = getSessionManager(dataSource);
        DBRProgressMonitor monitor = connection.getSession().getProgressMonitor();
        try (DBCSession session = DBUtils.openMetaSession(monitor, dataSource, "Terminate server sessions")) {
            // Session managers may put the session ID into SQL as is, so accept only IDs the server reports
            Set<String> knownIds = new HashSet<>();
            for (DBAServerSession serverSession : readSessions(manager, session, true)) {
                knownIds.add(serverSession.getSessionId());
            }
            for (String sessionId : sessionIds) {
                if (!knownIds.contains(sessionId)) {
                    throw new DBWebException("Session '" + sessionId + "' not found. It may have already ended.");
                }
            }
            Map<String, Object> options = new HashMap<>();
            if (cancelQueryOnly) {
                options.put(PostgreSessionManager.OPTION_QUERY_CANCEL, true);
                options.put(OPTION_KILL_QUERY, true);
            } else {
                options.putAll(manager.getTerminateOptions());
            }
            for (String sessionId : sessionIds) {
                manager.alterSession(session, sessionId, options);
            }
            return true;
        } catch (DBException e) {
            throw new DBWebException(cancelQueryOnly ? "Error canceling queries" : "Error terminating sessions", e);
        }
    }

    @NotNull
    @Override
    public WebDBAdminLockList listLocks(@NotNull WebConnectionInfo connection) throws DBWebException {
        DBPDataSource dataSource = getConnectedDataSource(connection);
        PostgreLockManager manager = getLockManager(dataSource);
        DBRProgressMonitor monitor = connection.getSession().getProgressMonitor();
        try (DBCSession session = DBUtils.openMetaSession(monitor, dataSource, "Read locks")) {
            Map<Object, PostgreLock> locks = manager.getLocks(session, new HashMap<>());
            List<WebDBAdminColumn> columns = new ArrayList<>();
            List<WebDBAdminLock> result = new ArrayList<>(locks.size());
            for (PostgreLock lock : locks.values()) {
                List<String> values = collectValues(monitor, lock, columns);
                Object holdId = lock.getHoldID();
                result.add(new WebDBAdminLock(
                    String.valueOf(lock.getId()),
                    holdId == null || Integer.valueOf(0).equals(holdId) ? null : String.valueOf(holdId),
                    lock.getTitle(),
                    values
                ));
            }
            return new WebDBAdminLockList(columns, result);
        } catch (DBException e) {
            throw new DBWebException("Error reading locks", e);
        }
    }

    @NotNull
    @Override
    public WebDBAdminLockDetails getLockDetails(@NotNull WebConnectionInfo connection, @Nullable String lockId) throws DBWebException {
        DBPDataSource dataSource = getConnectedDataSource(connection);
        PostgreLockManager manager = getLockManager(dataSource);
        DBRProgressMonitor monitor = connection.getSession().getProgressMonitor();
        try (DBCSession session = DBUtils.openMetaSession(monitor, dataSource, "Read lock details")) {
            PostgreLock lock = findLock(manager, session, lockId);
            return new WebDBAdminLockDetails(
                readLockItems(monitor, manager, session, LockGraphManager.typeWait, PostgreLockManager.pidWait, lock.getWait_pid()),
                readLockItems(monitor, manager, session, LockGraphManager.typeHold, PostgreLockManager.pidHold, lock.getHold_pid())
            );
        } catch (DBException e) {
            throw new DBWebException("Error reading lock details", e);
        }
    }

    @Override
    public boolean terminateLock(@NotNull WebConnectionInfo connection, @Nullable String lockId) throws DBWebException {
        DBPDataSource dataSource = getConnectedDataSource(connection);
        PostgreLockManager manager = getLockManager(dataSource);
        DBRProgressMonitor monitor = connection.getSession().getProgressMonitor();
        try (DBCSession session = DBUtils.openMetaSession(monitor, dataSource, "Terminate waiting session")) {
            PostgreLock lock = findLock(manager, session, lockId);
            manager.alterSession(session, lock, new HashMap<>());
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error terminating the waiting session", e);
        }
    }

    @NotNull
    private static DBPDataSource getConnectedDataSource(@NotNull WebConnectionInfo connection) throws DBWebException {
        DBPDataSourceContainer container = connection.getDataSourceContainer();
        DBPDataSource dataSource = container.getDataSource();
        if (!container.isConnected() || dataSource == null) {
            throw new DBWebException("Connection '" + container.getName() + "' is not connected");
        }
        return dataSource;
    }

    @Nullable
    @SuppressWarnings("unchecked")
    private static DBAServerSessionManager<DBAServerSession> findSessionManager(@NotNull DBPDataSource dataSource) {
        return DBUtils.getAdapter(DBAServerSessionManager.class, dataSource);
    }

    @NotNull
    private static DBAServerSessionManager<DBAServerSession> getSessionManager(@NotNull DBPDataSource dataSource) throws DBWebException {
        DBAServerSessionManager<DBAServerSession> manager = findSessionManager(dataSource);
        if (manager == null) {
            throw new DBWebException("Session manager isn't supported for " + dataSource.getContainer().getDriver().getName());
        }
        return manager;
    }

    @Nullable
    private static PostgreLockManager findLockManager(@NotNull DBPDataSource dataSource) {
        if (dataSource instanceof PostgreDataSource postgreDataSource && postgreDataSource.getServerType().supportsLocks()) {
            return new PostgreLockManager(postgreDataSource);
        }
        return null;
    }

    @NotNull
    private static PostgreLockManager getLockManager(@NotNull DBPDataSource dataSource) throws DBWebException {
        PostgreLockManager manager = findLockManager(dataSource);
        if (manager == null) {
            throw new DBWebException("Lock manager isn't supported for " + dataSource.getContainer().getDriver().getName());
        }
        return manager;
    }

    @NotNull
    private static Collection<DBAServerSession> readSessions(
        @NotNull DBAServerSessionManager<DBAServerSession> manager,
        @NotNull DBCSession session,
        boolean showIdle
    ) throws DBException {
        Map<String, Object> options = new HashMap<>();
        options.put(PostgreSessionManager.OPTION_SHOW_IDLE, showIdle);
        return manager.getSessions(session, options);
    }

    @NotNull
    private static PostgreLock findLock(
        @NotNull PostgreLockManager manager,
        @NotNull DBCSession session,
        @Nullable String lockId
    ) throws DBException {
        // Look the lock up on the server: lock IDs come from the client and must not reach SQL directly
        for (PostgreLock lock : manager.getLocks(session, new HashMap<>()).values()) {
            if (String.valueOf(lock.getId()).equals(lockId)) {
                return lock;
            }
        }
        throw new DBWebException("Lock '" + lockId + "' not found. It may have already been released.");
    }

    @NotNull
    private static WebDBAdminLockItemList readLockItems(
        @NotNull DBRProgressMonitor monitor,
        @NotNull PostgreLockManager manager,
        @NotNull DBCSession session,
        @NotNull String type,
        @NotNull String pidOption,
        int pid
    ) throws DBException {
        List<WebDBAdminColumn> columns = new ArrayList<>();
        List<WebDBAdminRow> rows = new ArrayList<>();
        if (pid == 0) {
            return new WebDBAdminLockItemList(null, columns, rows);
        }
        Map<String, Object> options = new HashMap<>();
        options.put(LockGraphManager.keyType, type);
        options.put(pidOption, pid);
        for (PostgreLockItem item : manager.getLockItems(session, options)) {
            rows.add(new WebDBAdminRow(collectValues(monitor, item, columns)));
        }
        return new WebDBAdminLockItemList(String.valueOf(pid), columns, rows);
    }

    /**
     * Reads displayable property values of an object.
     * Fills {@code columns} from the first object; all objects in one list have the same type.
     */
    @NotNull
    private static List<String> collectValues(
        @NotNull DBRProgressMonitor monitor,
        @NotNull Object object,
        @NotNull List<WebDBAdminColumn> columns
    ) {
        PropertyCollector collector = new PropertyCollector(object, false);
        collector.collectProperties();
        List<DBPPropertyDescriptor> properties = new ArrayList<>();
        for (DBPPropertyDescriptor property : collector.getProperties()) {
            if (property instanceof ObjectPropertyDescriptor opd && (opd.isHidden() || opd.isPassword())) {
                continue;
            }
            properties.add(property);
        }
        if (columns.isEmpty()) {
            for (DBPPropertyDescriptor property : properties) {
                columns.add(new WebDBAdminColumn(
                    property.getId(),
                    CommonUtils.notEmpty(property.getDisplayName()),
                    property.getDescription()
                ));
            }
        }
        List<String> values = new ArrayList<>(columns.size());
        for (WebDBAdminColumn column : columns) {
            values.add(formatValue(collector.getPropertyValue(monitor, column.getId())));
        }
        return values;
    }

    @Nullable
    private static String formatValue(@Nullable Object value) {
        if (value == null) {
            return null;
        } else if (value instanceof DBPNamedObject namedObject) {
            return namedObject.getName();
        } else if (value instanceof Date date) {
            return DATE_FORMAT.format(date.toInstant());
        } else if (value instanceof Object[] array) {
            return Arrays.toString(array);
        }
        return CommonUtils.toString(value);
    }
}

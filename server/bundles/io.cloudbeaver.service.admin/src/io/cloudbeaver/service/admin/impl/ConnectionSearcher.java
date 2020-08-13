/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
package io.cloudbeaver.service.admin.impl;

import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.admin.AdminConnectionSearchInfo;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.DBRRunnableWithProgress;
import org.jkiss.dbeaver.registry.DataSourceRegistry;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Connection search engine
 */
public class ConnectionSearcher implements DBRRunnableWithProgress {

    private final WebSession webSession;
    private final String[] hostNames;
    private final DataSourceRegistry tempRegistry;
    private List<AdminConnectionSearchInfo> foundConnections = new ArrayList<>();
    private List<DBPDriver> availableDrivers = new ArrayList<>();

    public ConnectionSearcher(WebSession webSession, String[] hostNames) {
        this.webSession = webSession;
        this.hostNames = hostNames;
        CBPlatform platform = CBPlatform.getInstance();
        this.tempRegistry = new DataSourceRegistry(platform, platform.getWorkspace().getActiveProject());

        availableDrivers.addAll(CBPlatform.getInstance().getApplicableDrivers());
    }

    public List<AdminConnectionSearchInfo> getFoundConnections() {
        return foundConnections;
    }

    @Override
    public void run(DBRProgressMonitor monitor) throws InvocationTargetException {
        monitor.beginTask("Search connections", hostNames.length * availableDrivers.size());
        try {
            for (String hostName : hostNames) {
                monitor.subTask("Search connections on '" + hostName + "'");
                searchConnections(monitor, hostName);
            }
        } catch (DBException e) {
            throw new InvocationTargetException(e);
        } finally {
            monitor.done();
        }
    }

    private void searchConnections(DBRProgressMonitor monitor, String hostName) throws DBException {
        int checkTimeout = 250;
        Map<Integer, AdminConnectionSearchInfo> portCache = new HashMap<>();

        for (DBPDriver driver : availableDrivers) {
            monitor.subTask("Check '" + driver.getName() + "' on '" + hostName + "'");
            if (!CommonUtils.isEmpty(driver.getDefaultPort())) {
                updatePortInfo(portCache, hostName, driver, checkTimeout);
            }
            monitor.worked(1);
        }
        for (AdminConnectionSearchInfo si : portCache.values()) {
            if (si.getDefaultDriver() != null) {
                foundConnections.add(si);
            }
        }
    }

    private void updatePortInfo(Map<Integer, AdminConnectionSearchInfo> portCache, String hostName, DBPDriver driver, int timeout) {
        int driverPort = CommonUtils.toInt(driver.getDefaultPort());
        if (driverPort <= 0) {
            return;
        }

        AdminConnectionSearchInfo searchInfo = portCache.get(driverPort);
        String driverId = WebServiceUtils.makeDriverFullId(driver);
        if (searchInfo != null) {
            searchInfo.getPossibleDrivers().add(driverId);
            return;
        }
        searchInfo = new AdminConnectionSearchInfo(hostName, driverPort);
        portCache.put(driverPort, searchInfo);

        try {
            try (Socket s = new Socket()) {
                s.setReuseAddress(true);
                SocketAddress sa = new InetSocketAddress(hostName, driverPort);
                s.connect(sa, timeout);
            }
            searchInfo.addDriver(driverId);
        } catch (Exception e) {
            // Ignore
        }
    }

}

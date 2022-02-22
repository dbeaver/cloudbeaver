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
package io.cloudbeaver.service.admin.impl;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.server.ConfigurationUtils;
import io.cloudbeaver.service.admin.AdminConnectionSearchInfo;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.DBRRunnableWithProgress;
import org.jkiss.dbeaver.registry.DataSourceRegistry;
import org.jkiss.utils.CommonUtils;

import java.net.InetAddress;
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
    private final List<AdminConnectionSearchInfo> foundConnections = new ArrayList<>();
    private List<DBPDriver> availableDrivers = new ArrayList<>();

    public ConnectionSearcher(WebSession webSession, String[] hostNames) {
        this.webSession = webSession;
        this.hostNames = hostNames;
        CBPlatform platform = CBPlatform.getInstance();
        this.tempRegistry = new DataSourceRegistry(platform, platform.getWorkspace().getActiveProject());

        this.availableDrivers.addAll(CBPlatform.getInstance().getApplicableDrivers());
    }

    public List<AdminConnectionSearchInfo> getFoundConnections() {
        synchronized (foundConnections) {
            return new ArrayList<>(foundConnections);
        }
    }

    @Override
    public void run(DBRProgressMonitor monitor) {
        List<String> finalHostNames = new ArrayList<>();
        Map<String, String> localHostNames = new HashMap<>();
        for (String hostName : hostNames) {
            monitor.subTask("Search connections on '" + hostName + "'");
            if (hostName.equals("localhost") || hostName.equals("local") || hostName.equals("127.0.0.1")) {
                for (InetAddress addr : CBPlatform.getInstance().getApplication().getLocalInetAddresses()) {
                    String localHostAddress = addr.getHostAddress();
                    finalHostNames.add(localHostAddress);
                    localHostNames.put(localHostAddress, hostName);
                }
            } else {
                finalHostNames.add(hostName);
            }
        }

        monitor.beginTask("Search connections", finalHostNames.size());
        try {
            ThreadGroup tg = new ThreadGroup("Connection search");
            List<Thread> threadList = new ArrayList<>();
            for (String hostName : finalHostNames) {
                monitor.subTask("Search connections on '" + hostName + "'");
                String localName = localHostNames.get(hostName);
                if (localName == null) {
                    localName = hostName;
                }
                String finalLocalName = localName;
                Runnable searchFunc = () -> searchConnections(monitor, hostName, finalLocalName);
                Thread t = new Thread(tg, searchFunc, "Search connection @" + hostName);
                threadList.add(t);
                t.start();
            }
            for (Thread t : threadList) {
                try {
                    t.join();
                } catch (InterruptedException e) {
                    // ignore
                }
            }
        } finally {
            monitor.done();
        }
    }

    private void searchConnections(DBRProgressMonitor monitor, String hostName, String displayName) {
        int checkTimeout = 150;
        Map<Integer, AdminConnectionSearchInfo> portCache = new HashMap<>();

        for (DBPDriver driver : availableDrivers) {
            monitor.subTask("Check '" + driver.getName() + "' on '" + hostName + "'");
            if (!CommonUtils.isEmpty(driver.getDefaultPort()) && !isPortInBlockList(CommonUtils.toInt(driver.getDefaultPort()))) {
                updatePortInfo(portCache, hostName, displayName, driver, checkTimeout);
            }
            monitor.worked(1);
        }
        for (AdminConnectionSearchInfo si : portCache.values()) {
            if (si.getDefaultDriver() != null) {
                synchronized (foundConnections) {
                    if (foundConnections.stream().noneMatch(fsi -> fsi.getDisplayName().equals(displayName) && fsi.getPort() == si.getPort())) {
                        foundConnections.add(si);
                    }
                }
            }
        }
    }

    private void updatePortInfo(Map<Integer, AdminConnectionSearchInfo> portCache, String hostName, String displayName, DBPDriver driver, int timeout) {
        if (!ConfigurationUtils.isDriverEnabled(driver)) {
            return;
        }
        int driverPort = CommonUtils.toInt(driver.getDefaultPort());
        if (driverPort <= 0) {
            return;
        }

        AdminConnectionSearchInfo searchInfo = portCache.get(driverPort);
        String driverId = driver.getFullId();
        if (searchInfo != null) {
            searchInfo.getPossibleDrivers().add(driverId);
            return;
        }
        searchInfo = new AdminConnectionSearchInfo(displayName, hostName, driverPort);
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

    private static boolean isPortInBlockList(int portNumber) {
        // All http(s) and telnet ports are in block lists
        switch (portNumber) {
            case 0:
            case 22:
            case 80:
            case 443:
            case 8080:
            case 8443:
                return true;
        }
        return false;
    }

}

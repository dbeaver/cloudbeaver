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
package io.cloudbeaver.service.admin;

import java.util.ArrayList;
import java.util.List;

public class AdminConnectionSearchInfo {
    private final String displayName;
    private final String hostAddr;
    private final int port;
    private List<String> possibleDrivers = new ArrayList<>();
    private String defaultDriver;

    public AdminConnectionSearchInfo(String displayName, String hostAddr, int driverPort) {
        this.displayName = displayName;
        this.hostAddr = hostAddr;
        this.port = driverPort;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getHostAddr() {
        return hostAddr;
    }

    public String getHost() {
        return hostAddr;
    }

    public int getPort() {
        return port;
    }

    public List<String> getPossibleDrivers() {
        return possibleDrivers;
    }

    public String getDefaultDriver() {
        return defaultDriver;
    }

    public void addDriver(String driverId) {
        if (this.defaultDriver == null) {
            this.defaultDriver = driverId;
        }
        this.possibleDrivers.add(driverId);
    }
}

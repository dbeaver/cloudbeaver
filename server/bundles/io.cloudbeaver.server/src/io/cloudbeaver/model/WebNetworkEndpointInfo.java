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
package io.cloudbeaver.model;

/**
 * WebNetworkEndpointInfo
 */
public class WebNetworkEndpointInfo {

    private String message;
    private String clientVersion;
    private String serverVersion;

    public WebNetworkEndpointInfo(String message) {
        this.message = message;
    }

    public WebNetworkEndpointInfo(String message, String clientVersion, String serverVersion) {
        this.message = message;
        this.clientVersion = clientVersion;
        this.serverVersion = serverVersion;
    }

    public String getMessage() {
        return message;
    }

    public String getClientVersion() {
        return clientVersion;
    }

    public void setClientVersion(String clientVersion) {
        this.clientVersion = clientVersion;
    }

    public String getServerVersion() {
        return serverVersion;
    }

    public void setServerVersion(String serverVersion) {
        this.serverVersion = serverVersion;
    }
}

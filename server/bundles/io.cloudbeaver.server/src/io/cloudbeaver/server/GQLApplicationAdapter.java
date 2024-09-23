/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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

import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.registry.WebDriverRegistry;
import org.jkiss.code.NotNull;

import java.net.InetAddress;
import java.util.List;
import java.util.Map;

//FIXME: this interface should not exist,
// the logic of platforms and applications should be separated from each other
public interface GQLApplicationAdapter extends WebApplication {
    AppWebSessionManager getSessionManager();

    WebDriverRegistry getDriverRegistry();

    @NotNull
    Map<String, Object> getProductConfiguration();

    List<InetAddress> getLocalInetAddresses();

    Map<String, String> getInitActions();

    boolean isLicenseValid();

    String getLicenseStatus();
}

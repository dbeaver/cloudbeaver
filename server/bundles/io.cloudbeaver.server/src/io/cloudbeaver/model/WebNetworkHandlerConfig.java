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

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.DBWHandlerType;
import org.jkiss.dbeaver.model.net.ssh.SSHConstants;
import org.jkiss.utils.CommonUtils;

import java.util.Map;

/**
 * Web network handler info
 */
public class WebNetworkHandlerConfig {

    private final DBWHandlerConfiguration configuration;

    public WebNetworkHandlerConfig(DBWHandlerConfiguration configuration) {
        this.configuration = configuration;
    }

    public DBWHandlerType getType() {
        return configuration.getType();
    }

    public boolean isSecured() {
        return configuration.isSecured();
    }

    @NotNull
    public String getId() {
        return configuration.getId();
    }

    public boolean isEnabled() {
        return configuration.isEnabled();
    }

    public SSHConstants.AuthType getAuthType() {
        return CommonUtils.valueOf(SSHConstants.AuthType.class, configuration.getStringProperty(SSHConstants.PROP_AUTH_TYPE), SSHConstants.AuthType.PASSWORD);
    }

    public String getUserName() {
        return configuration.getUserName();
    }

    public String getPassword() {
        return CommonUtils.isEmpty(configuration.getPassword()) ? null : "";
    }


    public String getKey() {
        return CommonUtils.isEmpty(configuration.getSecureProperty(SSHConstants.PROP_KEY_VALUE)) ? null : "";
    }

    public boolean isSavePassword() {
        return configuration.isSavePassword();
    }

    @NotNull
    public Map<String, Object> getProperties() {
        return configuration.getProperties();
    }

}

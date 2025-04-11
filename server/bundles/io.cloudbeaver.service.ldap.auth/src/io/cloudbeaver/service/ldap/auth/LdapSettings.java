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
package io.cloudbeaver.service.ldap.auth;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.utils.CommonUtils;

public class LdapSettings {
    @NotNull
    private final SMAuthProviderCustomConfiguration providerConfiguration;
    @NotNull
    private final String host;
    @NotNull
    private final String baseDN;
    private final int port;
    @NotNull
    private final String userIdentifierAttr;
    private final String bindUser;
    private final String bindUserPassword;
    private final String filter;
    private final String loginAttribute;


    public LdapSettings(
        SMAuthProviderCustomConfiguration providerConfiguration
    ) {
        this.providerConfiguration = providerConfiguration;
        this.host = providerConfiguration.getParameter(LdapConstants.PARAM_HOST);
        this.port = CommonUtils.isNotEmpty(providerConfiguration.getParameter(LdapConstants.PARAM_PORT)) ? Integer.parseInt(
            providerConfiguration.getParameter(LdapConstants.PARAM_PORT)) : 389;
        this.baseDN = providerConfiguration.getParameterOrDefault(LdapConstants.PARAM_DN, "");
        this.userIdentifierAttr = providerConfiguration.getParameterOrDefault(LdapConstants.PARAM_USER_IDENTIFIER_ATTR,
            "cn");
        this.bindUser = providerConfiguration.getParameterOrDefault(LdapConstants.PARAM_BIND_USER, "");
        this.bindUserPassword = providerConfiguration.getParameterOrDefault(LdapConstants.PARAM_BIND_USER_PASSWORD, "");
        this.filter = providerConfiguration.getParameterOrDefault(LdapConstants.PARAM_FILTER, "");
        this.loginAttribute = providerConfiguration.getParameterOrDefault(LdapConstants.PARAM_LOGIN, "");;
    }


    @NotNull
    public String getBaseDN() {
        return baseDN;
    }

    @NotNull
    public String getHost() {
        return host;
    }

    public int getPort() {
        return port;
    }

    public String getLdapProviderUrl() {
        return "ldap://" + getHost() + ":" + getPort();
    }

    @NotNull
    public String getUserIdentifierAttr() {
        return userIdentifierAttr;
    }

    public String getBindUserDN() {
        return bindUser;
    }

    public String getBindUserPassword() {
        return bindUserPassword;
    }

    public String getFilter() {
        return filter;
    }

    public String getLoginAttribute() {
        return loginAttribute;
    }

    @NotNull
    public SMAuthProviderCustomConfiguration getProviderConfiguration() {
        return providerConfiguration;
    }
}

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
package io.cloudbeaver.service.auth.ldap;

import io.cloudbeaver.service.auth.ldap.ssl.LdapSslSetting;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.utils.CommonUtils;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public class LdapSettings {
    private static final Log log = Log.getLog(LdapSettings.class);

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
    private final LdapSslSetting ldapSslSetting;
    private final String referralHandlingMode;
    @NotNull
    private final String firstNameAttr;
    @NotNull
    private final String lastNameAttr;
    @NotNull
    private final String displayNameAttr;
    @NotNull
    private final Map<String, String> userMetaAttrs;


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
        this.loginAttribute = providerConfiguration.getParameterOrDefault(LdapConstants.PARAM_LOGIN, "");
        this.ldapSslSetting = new LdapSslSetting(
            providerConfiguration.getParameter(LdapConstants.PARAM_SSL_ENABLE),
            providerConfiguration.getParameter(LdapConstants.PARAM_SSL_CERT)
        );
        this.referralHandlingMode = providerConfiguration.getParameterOrDefault(LdapConstants.PARAM_REFERRAL_HANDLING,  "ignore");
        this.firstNameAttr = readAttributeName(LdapConstants.PARAM_FIRST_NAME_ATTR, LdapConstants.DEFAULT_FIRST_NAME_ATTR);
        this.lastNameAttr = readAttributeName(LdapConstants.PARAM_LAST_NAME_ATTR, LdapConstants.DEFAULT_LAST_NAME_ATTR);
        this.displayNameAttr = readAttributeName(LdapConstants.PARAM_DISPLAY_NAME_ATTR, LdapConstants.DEFAULT_DISPLAY_NAME_ATTR);
        this.userMetaAttrs = parseUserMetaAttrs(providerConfiguration.getParameterOrDefault(LdapConstants.PARAM_USER_META_ATTRS, ""));
    }

    /**
     * Returns the configured attribute name, the default one if the parameter is not set at all,
     * or an empty string if it was explicitly cleared, which disables the mapping.
     */
    @NotNull
    private String readAttributeName(@NotNull String parameter, @NotNull String defaultValue) {
        Object value = providerConfiguration.getParameters().get(parameter);
        return value == null ? defaultValue : value.toString().trim();
    }

    /**
     * Parses {@code email=mail, title=title} into a map of user meta parameter to LDAP attribute.
     */
    @NotNull
    static Map<String, String> parseUserMetaAttrs(@Nullable Object value) {
        if (value == null || CommonUtils.isEmpty(value.toString())) {
            return Collections.emptyMap();
        }
        Map<String, String> result = new LinkedHashMap<>();
        for (String pair : value.toString().split(",")) {
            int separator = pair.indexOf('=');
            if (separator <= 0) {
                continue;
            }
            String metaParameter = pair.substring(0, separator).trim();
            String attribute = pair.substring(separator + 1).trim();
            if (metaParameter.isEmpty() || attribute.isEmpty()) {
                continue;
            }
            if (metaParameter.length() > LdapConstants.MAX_USER_META_PARAMETER_NAME_LENGTH) {
                log.warn("Ignored LDAP user attribute mapping '" + metaParameter + "': the name of a profile parameter can't be longer than "
                    + LdapConstants.MAX_USER_META_PARAMETER_NAME_LENGTH + " characters");
                continue;
            }
            result.put(metaParameter, attribute);
        }
        return Collections.unmodifiableMap(result);
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
        if (ldapSslSetting.isEnable()) {
            return "ldaps://" + getHost() + ":" + getPort();
        }
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

    public LdapSslSetting getLdapSslSetting() {
        return ldapSslSetting;
    }

    @NotNull
    public SMAuthProviderCustomConfiguration getProviderConfiguration() {
        return providerConfiguration;
    }

    public String getReferralHandlingMode() {
        return referralHandlingMode;
    }

    @NotNull
    public String getFirstNameAttr() {
        return firstNameAttr;
    }

    @NotNull
    public String getLastNameAttr() {
        return lastNameAttr;
    }

    @NotNull
    public String getDisplayNameAttr() {
        return displayNameAttr;
    }

    /**
     * User meta parameter to LDAP attribute mapping.
     */
    @NotNull
    public Map<String, String> getUserMetaAttrs() {
        return userMetaAttrs;
    }
}

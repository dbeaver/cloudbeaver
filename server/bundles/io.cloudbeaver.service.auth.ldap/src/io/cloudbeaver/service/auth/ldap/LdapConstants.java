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

public interface LdapConstants {
    String PARAM_HOST = "ldap-host";
    String PARAM_PORT = "ldap-port";
    String PARAM_DN = "ldap-dn";
    String PARAM_BIND_USER = "ldap-bind-user";
    String PARAM_BIND_USER_PASSWORD = "ldap-bind-user-pwd";
    String PARAM_FILTER = "ldap-filter";
    String PARAM_USER_IDENTIFIER_ATTR = "ldap-identifier-attr";
    String PARAM_LOGIN = "ldap-login";
    String PARAM_SSL_ENABLE = "ldap-enable-ssl";
    String PARAM_SSL_CERT = "ldap-ssl-cert";
    String PARAM_REFERRAL_HANDLING = "ldap-referral";
    /** LDAP attribute with the user first name. Empty value disables the mapping. */
    String PARAM_FIRST_NAME_ATTR = "ldap-first-name-attr";
    /** LDAP attribute with the user last name. Empty value disables the mapping. */
    String PARAM_LAST_NAME_ATTR = "ldap-last-name-attr";
    /** LDAP attribute with the name shown in the UI. Empty value disables the mapping. */
    String PARAM_DISPLAY_NAME_ATTR = "ldap-display-name-attr";
    /** Comma separated list of {@code metaParameter=ldapAttribute} pairs to copy into the user profile. */
    String PARAM_USER_META_ATTRS = "ldap-user-meta-attrs";

    /** Size of the user meta parameter name column in the database. */
    int MAX_USER_META_PARAMETER_NAME_LENGTH = 32;

    String DEFAULT_FIRST_NAME_ATTR = "givenName";
    String DEFAULT_LAST_NAME_ATTR = "sn";
    String DEFAULT_DISPLAY_NAME_ATTR = "displayName";

    String CRED_USERNAME = "user";
    String CRED_DISPLAY_NAME = "displayName";
    /** Human readable name read from the directory, unlike {@link #CRED_DISPLAY_NAME} which holds the login. */
    String CRED_FULL_NAME = "fullName";
    String CRED_USER_DN = "user-dn";
    String CRED_PASSWORD = "password";
    String CRED_SESSION_ID = "session-id";
    String LDAP_META_GROUP_NAME = "ldap.group-name";
}

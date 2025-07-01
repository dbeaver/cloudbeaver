/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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

    String CRED_USERNAME = "user";
    String CRED_DISPLAY_NAME = "displayName";
    String CRED_USER_DN = "user-dn";
    String CRED_PASSWORD = "password";
    String CRED_SESSION_ID = "session-id";
    String LDAP_META_GROUP_NAME = "ldap.group-name";
}

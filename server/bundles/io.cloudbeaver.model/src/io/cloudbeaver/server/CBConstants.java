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
package io.cloudbeaver.server;

/**
 * Various constants
 */
public class CBConstants {
    public static final int STATIC_CACHE_SECONDS = 60 * 60 * 24 * 3;

    public static final String CONF_DIR_NAME = "conf";
    public static final String RUNTIME_DATA_DIR_NAME = ".data";
    public static final String RUNTIME_APP_CONFIG_FILE_NAME = ".cloudbeaver.runtime.conf";
    public static final String RUNTIME_PRODUCT_CONFIG_FILE_NAME = ".product.runtime.conf";
    public static final String AUTO_CONFIG_FILE_NAME = ".cloudbeaver.auto.conf";

    public static final String PARAM_SERVER_CONFIGURATION = "server";
    public static final String PARAM_SERVER_PORT = "serverPort";
    public static final String PARAM_SERVER_HOST = "serverHost";
    public static final String PARAM_SERVER_NAME = "serverName";
    public static final String PARAM_SECURE_COOKIES = "secureCookies";
    public static final String PARAM_SSL_CONFIGURATION_PATH = "sslConfigurationPath";
    public static final String PARAM_CONTENT_ROOT = "contentRoot";
    public static final String PARAM_SERVER_URL = "serverURL";
    public static final String PARAM_ROOT_URI = "rootURI";
    public static final String PARAM_SERVICES_URI = "serviceURI";
    public static final String PARAM_DRIVERS_LOCATION = "driversLocation";
    public static final String PARAM_WORKSPACE_LOCATION = "workspaceLocation";
    //legacy path to a product.conf file
    @Deprecated
    public static final String PARAM_PRODUCT_CONFIGURATION = "productConfiguration";
    public static final String PARAM_PRODUCT_SETTINGS = "productSettings";
    public static final String PARAM_EXTERNAL_PROPERTIES = "externalProperties";
    public static final String PARAM_STATIC_CONTENT = "staticContent";
    public static final String PARAM_RESOURCE_QUOTAS = "resourceQuotas";
    public static final String PARAM_RESOURCE_MANAGER_ENABLED = "resourceManagerEnabled";
    public static final String PARAM_SECRET_MANAGER_ENABLED = "secretManagerEnabled";
    public static final String PARAM_SHOW_READ_ONLY_CONN_INFO = "showReadOnlyConnectionInfo";
    public static final String PARAM_CONN_GRANT_ANON_ACCESS = "grantConnectionsAccessToAnonymousTeam";
    public static final String PARAM_AUTH_PROVIDERS = "authConfiguration";
    public static final String PARAM_DB_CONFIGURATION = "database";

    public static final String PARAM_SESSION_EXPIRE_PERIOD = "expireSessionAfterPeriod";

    public static final String PARAM_DEVEL_MODE = "develMode";
    public static final String PARAM_SECURITY_MANAGER = "enableSecurityManager";
    public static final String PARAM_SM_CONFIGURATION = "sm";
    public static final String PARAM_PASSWORD_POLICY_CONFIGURATION = "passwordPolicy";

    public static final int DEFAULT_SERVER_PORT = 8080;
    //public static final String DEFAULT_SERVER_NAME = "CloudBeaver Web Server";
    public static final String DEFAULT_CONTENT_ROOT = "/var/www/cloudbeaver";
    public static final String DEFAULT_ROOT_URI = "/";
    public static final String DEFAULT_SERVICES_URI = "/api/";

    public static final String DEFAULT_DEPLOY_LOCATION = "/opt/cloudbeaver";
    public static final String DEFAULT_DRIVERS_LOCATION = DEFAULT_DEPLOY_LOCATION + "/drivers";
    public static final String DEFAULT_WORKSPACE_LOCATION = DEFAULT_DEPLOY_LOCATION + "/workspace";
    public static final String DEFAULT_PRODUCT_CONFIGURATION = "conf/product.conf";
    public static final String DEFAULT_DATASOURCE_PERMISSIONS_CONFIGURATION = "data-sources-permissions.json";
    public static final String DEFAULT_ADMIN_NAME = "cbadmin";
    public static final String DEFAULT_ADMIN_TEAM = "admin";

    public static final String ENV_CB_HOME = "CLOUDBEAVER_HOME";


    public static final String VAR_CB_LOCAL_HOST_ADDR = "CB_LOCAL_HOST_ADDR";
    public static final String VAR_HOST_DOCKER_INTERNAL = "host.docker.internal";

    public static final String VAR_AUTO_CB_SERVER_NAME = "CB_SERVER_NAME";
    public static final String VAR_AUTO_CB_SERVER_URL = "CB_SERVER_URL";
    public static final String VAR_AUTO_CB_ADMIN_NAME = "CB_ADMIN_NAME";
    public static final String VAR_AUTO_CB_ADMIN_PASSWORD = "CB_ADMIN_PASSWORD";

    public static final String CB_SESSION_COOKIE_NAME = "cb-session-id";

    public static final String APPLICATION_JSON = "application/json";

    public static final String QUOTA_PROP_FILE_LIMIT = "dataExportFileSizeLimit";
    public static final String ADMIN_AUTO_GRANT = "auto-grant";
    public static final String HOST_LOCALHOST = "localhost";
    public static final String HOST_127_0_0_1 = "127.0.0.1";
}

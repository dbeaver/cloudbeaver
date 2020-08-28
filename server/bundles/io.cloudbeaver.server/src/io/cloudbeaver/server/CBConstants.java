/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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

import org.jkiss.dbeaver.model.DBConstants;

import java.text.DateFormat;
import java.text.SimpleDateFormat;

/**
 * Various constants
 */
public class CBConstants {

    public static final DateFormat ISO_DATE_FORMAT = new SimpleDateFormat(DBConstants.DEFAULT_ISO_TIMESTAMP_FORMAT);

    public static final String DEFAULT_CONFIG_FILE_PATH = "/etc/cloudbeaver.conf";
    public static final String RUNTIME_DATA_DIR_NAME = ".data";
    public static final String RUNTIME_CONFIG_FILE_NAME = ".cloudbeaver.runtime.conf";

    public static final String CLI_PARAM_WEB_CONFIG = "-web-config";

    public static final String PARAM_SERVER_PORT = "serverPort";
    public static final String PARAM_SERVER_NAME = "serverName";
    public static final String PARAM_CONTENT_ROOT = "contentRoot";
    public static final String PARAM_ROOT_URI = "rootURI";
    public static final String PARAM_SERVICES_URI = "serviceURI";
    public static final String PARAM_DRIVERS_LOCATION = "driversLocation";
    public static final String PARAM_WORKSPACE_LOCATION = "workspaceLocation";
    public static final String PARAM_PRODUCT_CONFIGURATION = "productConfiguration";

    public static final String PARAM_SESSION_EXPIRE_PERIOD = "expireSessionAfterPeriod";

    public static final String PARAM_DEVEL_MODE = "develMode";

    public static final int DEFAULT_SERVER_PORT = 8080;
    //public static final String DEFAULT_SERVER_NAME = "CloudBeaver Web Server";
    public static final String DEFAULT_CONTENT_ROOT = "/var/www/cloudbeaver";
    public static final String DEFAULT_ROOT_URI = "/";
    public static final String DEFAULT_SERVICES_URI = "/dbeaver/";

    public static final String DEFAULT_DEPLOY_LOCATION = "/opt/cloudbeaver";
    public static final String DEFAULT_DRIVERS_LOCATION = DEFAULT_DEPLOY_LOCATION + "/drivers";
    public static final String DEFAULT_WORKSPACE_LOCATION = DEFAULT_DEPLOY_LOCATION + "/workspace";
    public static final String DEFAULT_PRODUCT_CONFIGURATION = "conf/product.conf";

    // Default max idle time (10 minutes)
    public static final long MAX_SESSION_IDLE_TIME = 10 * 60 * 1000;

    public static final String ENV_CB_HOME = "CLOUDBEAVER_HOME";

    public static final String DEFAUL_APP_ANONYMOUS_ROLE_NAME = "user";

}

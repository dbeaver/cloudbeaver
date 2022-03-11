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

import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.net.DBWHandlerType;
import org.jkiss.utils.CommonUtils;

import java.util.Map;

/**
 * Web network handler info
 */
public class WebNetworkHandlerConfigInput {

    private final Map<String, Object> cfg;

    public WebNetworkHandlerConfigInput(Map<String, Object> cfg) {
        this.cfg = cfg;
    }

    public DBWHandlerType getType() {
        return CommonUtils.valueOf(DBWHandlerType.class, JSONUtils.getString(cfg, "type"), null);
    }

    public String getId() {
        return JSONUtils.getString(cfg, "id");
    }

    public Boolean isEnabled() {
        if (cfg.containsKey("enabled")) {
            return JSONUtils.getBoolean(cfg, "enabled");
        } else {
            return null;
        }
    }

    public String getAuthType() {
        return JSONUtils.getString(cfg, "authType");
    }

    public String getUserName() {
        return JSONUtils.getString(cfg, "userName");
    }

    public String getPassword() {
        return JSONUtils.getString(cfg, "password");
    }

    public String getKey() {
        return JSONUtils.getString(cfg, "key");
    }

    public Boolean isSavePassword() {
        if (cfg.containsKey("savePassword")) {
            return JSONUtils.getBoolean(cfg, "savePassword");
        } else {
            return null;
        }
    }

    public Map<String, Object> getProperties() {
        return JSONUtils.getObjectOrNull(cfg, "properties");
    }

}

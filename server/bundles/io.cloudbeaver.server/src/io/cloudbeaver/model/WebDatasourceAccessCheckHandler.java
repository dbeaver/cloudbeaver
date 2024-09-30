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

package io.cloudbeaver.model;

import io.cloudbeaver.model.config.CBAppConfig;
import io.cloudbeaver.model.utils.ConfigurationUtils;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.dbeaver.model.connection.DBPDriver;

//TODO move to a separate CBApplication plugin
public class WebDatasourceAccessCheckHandler extends BaseDatasourceAccessCheckHandler {
    @Override
    protected boolean isDriverDisabled(DBPDriver driver) {
        if (!WebAppUtils.getWebApplication().isMultiuser()) {
            return false;
        }
        CBAppConfig config = CBApplication.getInstance().getAppConfiguration();
        return !ConfigurationUtils.isDriverEnabled(
            driver,
            config.getEnabledDrivers(),
            config.getDisabledDrivers());
    }
}

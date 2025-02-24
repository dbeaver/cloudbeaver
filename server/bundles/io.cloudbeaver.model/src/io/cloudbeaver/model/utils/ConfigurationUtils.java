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
package io.cloudbeaver.model.utils;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

public class ConfigurationUtils {
    private ConfigurationUtils() {
    }

    public static boolean isDriverEnabled(
        @NotNull DBPDriver driver,
        @Nullable String[] enabledDrivers,
        @Nullable String[] disabledDrivers
    ) {
        if (ArrayUtils.contains(enabledDrivers, driver.getFullId())) {
            return true;
        }
        if (ArrayUtils.contains(disabledDrivers, driver.getFullId())) {
            return false;
        }
        return !driver.isEmbedded() || CommonUtils.toBoolean(driver.getDriverParameter(DBConstants.PARAM_SAFE_EMBEDDED_DRIVER), false);
    }

}

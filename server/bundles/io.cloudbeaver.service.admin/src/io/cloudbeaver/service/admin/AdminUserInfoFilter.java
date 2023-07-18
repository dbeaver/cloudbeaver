/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
package io.cloudbeaver.service.admin;

import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.security.user.SMUserFilter;

import java.util.Map;

public class AdminUserInfoFilter extends SMUserFilter {
    public AdminUserInfoFilter(Map<String, Object> params) {
        super(JSONUtils.getString(params, "userIdMask"),
                params.containsKey("enabledState") ? JSONUtils.getBoolean(params, "enabledState") : null);
    }
}

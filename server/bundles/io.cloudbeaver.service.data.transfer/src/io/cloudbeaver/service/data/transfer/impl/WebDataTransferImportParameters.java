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
package io.cloudbeaver.service.data.transfer.impl;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Map;

/**
 * Parameters of a data import
 */
public class WebDataTransferImportParameters {

    private final String processorId;
    private final Map<String, Object> settings;

    public WebDataTransferImportParameters(@NotNull Map<String, Object> params) {
        this.processorId = JSONUtils.getString(params, "processorId");
        this.settings = JSONUtils.getObjectOrNull(params, "settings");
    }

    @Nullable
    public String getProcessorId() {
        return processorId;
    }

    @Nullable
    public Map<String, Object> getSettings() {
        return settings;
    }
}

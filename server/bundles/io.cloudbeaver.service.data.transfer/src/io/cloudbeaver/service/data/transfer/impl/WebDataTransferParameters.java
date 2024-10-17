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
package io.cloudbeaver.service.data.transfer.impl;

import io.cloudbeaver.service.sql.WebSQLDataFilter;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Map;

public class WebDataTransferParameters {

    @NotNull
    private final String processorId;
    @NotNull
    private final Map<String, Object> dbProducerSettings;
    @NotNull
    private final Map<String, Object> processorProperties;
    @NotNull
    private final WebSQLDataFilter filter;
    @NotNull
    private final WebDataTransferOutputSettings outputSettings;

    public WebDataTransferParameters(Map<String, Object> params) {
        this.processorId = JSONUtils.getString(params, "processorId", "");
        this.dbProducerSettings = JSONUtils.getObject(params, "settings");
        this.processorProperties = JSONUtils.getObject(params, "processorProperties");
        this.filter = new WebSQLDataFilter(JSONUtils.getObject(params, "filter"));
        this.outputSettings = new WebDataTransferOutputSettings(JSONUtils.getObject(params, "outputSettings"));
    }

    @NotNull
    public String getProcessorId() {
        return processorId;
    }

    @NotNull
    public Map<String, Object> getDbProducerSettings() {
        return dbProducerSettings;
    }

    @NotNull
    public Map<String, Object> getProcessorProperties() {
        return processorProperties;
    }

    @NotNull
    public WebSQLDataFilter getFilter() {
        return filter;
    }

    @NotNull
    public WebDataTransferOutputSettings getOutputSettings() {
        return outputSettings;
    }
}
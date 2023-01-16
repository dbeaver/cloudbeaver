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
package io.cloudbeaver.service.data.transfer.impl;

import io.cloudbeaver.service.sql.WebSQLDataFilter;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Map;

public class WebDataTransferParameters {

    private String processorId;
    private Map<String, Object> dbProducerSettings;
    private Map<String, Object> processorProperties;
    private WebSQLDataFilter filter;
    private WebDataTransferOutputSettings outputSettings;

    public WebDataTransferParameters() {
    }

    public WebDataTransferParameters(Map<String, Object> params) {
        this.processorId = JSONUtils.getString(params, "processorId");
        this.dbProducerSettings = JSONUtils.getObject(params, "settings");
        this.processorProperties = JSONUtils.getObject(params, "processorProperties");
        this.filter = new WebSQLDataFilter(JSONUtils.getObject(params, "filter"));
        this.outputSettings = new WebDataTransferOutputSettings(JSONUtils.getObject(params, "outputSettings"));
    }

    public String getProcessorId() {
        return processorId;
    }

    public void setProcessorId(String processorId) {
        this.processorId = processorId;
    }

    public Map<String, Object> getDbProducerSettings() {
        return dbProducerSettings;
    }

    public void setDbProducerSettings(Map<String, Object> dbProducerSettings) {
        this.dbProducerSettings = dbProducerSettings;
    }

    public Map<String, Object> getProcessorProperties() {
        return processorProperties;
    }

    public void setProcessorProperties(Map<String, Object> processorProperties) {
        this.processorProperties = processorProperties;
    }

    public WebSQLDataFilter getFilter() {
        return filter;
    }

    public void setFilter(WebSQLDataFilter filter) {
        this.filter = filter;
    }

    public WebDataTransferOutputSettings getOutputSettings() {
        return outputSettings;
    }
}
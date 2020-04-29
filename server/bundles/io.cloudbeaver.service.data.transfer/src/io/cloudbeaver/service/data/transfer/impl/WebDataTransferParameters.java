package io.cloudbeaver.service.data.transfer.impl;

import io.cloudbeaver.service.sql.WebSQLDataFilter;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Map;

public class WebDataTransferParameters {

    private String processorId;
    private Map<String, Object> settings;
    private Map<String, Object> processorProperties;
    private WebSQLDataFilter filter;

    public WebDataTransferParameters() {
    }

    public WebDataTransferParameters(Map<String, Object> params) {
        this.processorId = JSONUtils.getString(params, "processorId");
        this.settings = JSONUtils.getObject(params, "settings");
        this.processorProperties = JSONUtils.getObject(params, "processorProperties");
        this.filter = new WebSQLDataFilter(JSONUtils.getObject(params, "filter"));
    }

    public String getProcessorId() {
        return processorId;
    }

    public void setProcessorId(String processorId) {
        this.processorId = processorId;
    }

    public Map<String, Object> getSettings() {
        return settings;
    }

    public void setSettings(Map<String, Object> settings) {
        this.settings = settings;
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
}
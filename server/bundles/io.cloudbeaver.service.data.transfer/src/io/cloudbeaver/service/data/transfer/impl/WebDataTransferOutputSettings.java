package io.cloudbeaver.service.data.transfer.impl;

import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Map;

public class WebDataTransferOutputSettings {
    private final boolean insertBom;
    private final String encoding;
    private final String timestampPattern;

    public WebDataTransferOutputSettings(Map<String, Object> outputSettings) {
        this.insertBom = JSONUtils.getBoolean(outputSettings, "insertBom", false);
        this.encoding = JSONUtils.getString(outputSettings, "encoding");
        this.timestampPattern = JSONUtils.getString(outputSettings, "timestampPattern");
    }

    public WebDataTransferOutputSettings(boolean insertBom, String encoding, String timestampPattern) {
        this.insertBom = insertBom;
        this.encoding = encoding;
        this.timestampPattern = timestampPattern;
    }

    public boolean isInsertBom() {
        return insertBom;
    }

    public String getEncoding() {
        return encoding;
    }

    public String getTimestampPattern() {
        return timestampPattern;
    }
}

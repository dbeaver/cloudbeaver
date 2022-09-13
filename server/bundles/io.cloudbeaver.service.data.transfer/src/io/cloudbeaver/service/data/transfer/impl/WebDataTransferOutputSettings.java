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

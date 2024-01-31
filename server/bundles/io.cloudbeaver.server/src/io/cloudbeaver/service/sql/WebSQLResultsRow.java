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
package io.cloudbeaver.service.sql;

import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Map;

/**
 * Web query results row.
 */
public class WebSQLResultsRow {

    private Object[] data;
    private Map<String, Object> updateValues;

    @Nullable
    private Map<String, Object> metaData;

    public WebSQLResultsRow() {
    }

    public WebSQLResultsRow(Map<String, Object> map) {
        data = JSONUtils.getObjectList(map, "data").toArray();
        updateValues = JSONUtils.getObject(map, "updateValues");
        metaData = JSONUtils.getObject(map, "metaData");
    }

    public Object[] getData() {
        return data;
    }

    public Map<String, Object> getUpdateValues() {
        return updateValues;
    }

    @Nullable
    public Map<String, Object> getMetaData() {
        return metaData;
    }
}

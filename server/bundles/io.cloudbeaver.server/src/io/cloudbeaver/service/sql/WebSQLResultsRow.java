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
package io.cloudbeaver.service.sql;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.data.DBDValueRow;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Collections;
import java.util.Map;

/**
 * Web query results row.
 */
public class WebSQLResultsRow implements DBDValueRow {

    private Object[] data = new Object[0];
    private Map<String, Object> updateValues = Collections.emptyMap();
    private Object[] resultRowValues;
    private Map<Integer, Object> originalKeyValues = Collections.emptyMap();
    private int rowNumber;

    @Nullable
    private Map<String, Object> metaData;

    public WebSQLResultsRow() {
    }

    public WebSQLResultsRow(@NotNull Map<String, Object> map) {
        data = JSONUtils.getObjectList(map, "data").toArray();
        Map<String, Object> updates = JSONUtils.getObject(map, "updateValues");
        if (updates != null) {
            updateValues = updates;
        }
        metaData = JSONUtils.getObject(map, "metaData");
    }

    @NotNull
    public Map<String, Object> getUpdateValues() {
        return updateValues;
    }

    @Nullable
    public Map<String, Object> getMetaData() {
        return metaData;
    }

    @Override
    public int getRowNumber() {
        return rowNumber;
    }

    public void setRowNumber(int rowNumber) {
        this.rowNumber = rowNumber;
    }

    @NotNull
    @Override
    public Object[] getValues() {
        return data;
    }

    @Nullable
    public Object[] getResultRowValues() {
        return resultRowValues;
    }

    public void setResultRowValues(@NotNull Object[] resultRowValues) {
        this.resultRowValues = resultRowValues;
    }

    @Nullable
    public Object getOriginalKeyValue(int index) {
        return originalKeyValues.get(index);
    }

    public void setOriginalKeyValues(@NotNull Map<Integer, Object> originalKeyValues) {
        this.originalKeyValues = originalKeyValues;
    }
}

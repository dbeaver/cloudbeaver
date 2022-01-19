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
package io.cloudbeaver.service.sql;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDRowIdentifier;
import org.jkiss.dbeaver.model.struct.DBSAttributeBase;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.struct.DBSTypedObject;

import java.util.List;

/**
 * Web query results info.
 */
public class WebSQLResultsInfo {

    @NotNull
    private final DBSDataContainer dataContainer;
    @NotNull
    private final String id;
    private DBDAttributeBinding[] attributes;

    public WebSQLResultsInfo(@NotNull DBSDataContainer dataContainer, @NotNull String id) {
        this.dataContainer = dataContainer;
        this.id = id;
    }

    @NotNull
    public String getId() {
        return id;
    }

    @NotNull
    public DBSDataContainer getDataContainer() {
        return dataContainer;
    }

    public DBDAttributeBinding[] getAttributes() {
        return attributes;
    }

    public void setAttributes(DBDAttributeBinding[] attributes) {
        this.attributes = attributes;
    }

    @Nullable
    public DBDRowIdentifier getDefaultRowIdentifier() {
        for (DBDAttributeBinding column : attributes) {
            DBDRowIdentifier rowIdentifier = column.getRowIdentifier();
            if (rowIdentifier != null) {
                return rowIdentifier;
            }
        }
        return null;
    }

    public DBSAttributeBase getAttribute(String attributeName) {
        DBPDataSource dataSource = dataContainer.getDataSource();

        DBDAttributeBinding[] attrList = attributes;
        DBDAttributeBinding binding = null;
        for (String san : attributeName.split("\\.")) {
            if (dataSource != null) {
                san = DBUtils.getUnQuotedIdentifier(dataSource, san);
            }
            binding = DBUtils.findObject(attrList, san);
            if (binding == null) {
                return null;
            }
            List<DBDAttributeBinding> nestedBindings = binding.getNestedBindings();
            if (nestedBindings != null && !nestedBindings.isEmpty()) {
                attrList = nestedBindings.toArray(new DBDAttributeBinding[0]);
            }
        }
        return binding == null ? null : binding.getAttribute();
    }

    public DBSTypedObject getAttributeByPosition(int pos) {
        for (DBDAttributeBinding attr : attributes) {
            if (attr.getOrdinalPosition() == pos) {
                return attr;
            }
        }
        return null;
    }

}

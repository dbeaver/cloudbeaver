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
package io.cloudbeaver.model;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.sql.SQLDialectInsertReplaceMethod;
import org.jkiss.dbeaver.model.sql.SQLDialectMetadata;
import org.jkiss.dbeaver.model.struct.DBSDataBulkLoader;
import org.jkiss.utils.CommonUtils;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class WebDriverConfiguration {

    @NotNull
    private final DBPDataSourceContainer dataSourceContainer;

    public WebDriverConfiguration(@NotNull DBPDataSourceContainer dataSourceContainer) {
        this.dataSourceContainer = dataSourceContainer;
    }

    /**
     * 'On duplicate key' replace methods supported by this connection's SQL dialect
     */
    @Property
    @NotNull
    public List<WebDictionaryValueInfo> getSupportedInsertReplaceMethods() {
        SQLDialectMetadata dialect = dataSourceContainer.getDriver().getScriptDialect();
        List<SQLDialectInsertReplaceMethod> replaceMethods = dialect.getSupportedInsertReplaceMethodsDescriptors();
        if (CommonUtils.isEmpty(replaceMethods)) {
            return Collections.emptyList();
        }
        return replaceMethods.stream()
            .map(method -> new WebDictionaryValueInfo(method.getId(), method.getLabel(), method.getDescription()))
            .collect(Collectors.toList());
    }

    /**
     * Whether the connection's database supports bulk load during data import
     */
    @Property
    public boolean isSupportsBulkLoad() {
        DBPDataSource dataSource = dataSourceContainer.getDataSource();
        return dataSource != null && DBUtils.getAdapter(DBSDataBulkLoader.class, dataSource) != null;
    }

    /**
     * Whether the connection's database supports transaction
     */
    @Property
    public boolean isSupportsTransactions() {
        DBPDataSource dataSource = dataSourceContainer.getDataSource();
        return dataSource != null && dataSource.getInfo().supportsTransactions();
    }
}

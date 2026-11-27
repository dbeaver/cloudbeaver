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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.exec.DBCAttributeMetaData;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.SQLQuery;
import org.jkiss.dbeaver.model.sql.parser.SQLParserContext;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;

/** Converts raw result-set values to graph data for data sources that support time series. */
public interface WebTimeSeriesDataAdapter {
    boolean supportsResult(@NotNull DBSDataContainer container, @NotNull DBDAttributeBinding[] bindings);

    /** Returns a stable key with value equality for a result group, when the driver exposes one. */
    @Nullable
    default Object getResultGroupKey(@NotNull DBSDataContainer container, @NotNull DBCAttributeMetaData column) {
        return null;
    }

    /** Dialect-specific classification when the common parser cannot classify the statement. */
    default boolean supportsUnparsedRead(@NotNull SQLParserContext context, @NotNull SQLQuery query) {
        return false;
    }

    @NotNull
    Object build(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBSDataContainer container,
        @NotNull DBDAttributeBinding[] bindings,
        @NotNull Object[][] rows
    ) throws DBException;
}

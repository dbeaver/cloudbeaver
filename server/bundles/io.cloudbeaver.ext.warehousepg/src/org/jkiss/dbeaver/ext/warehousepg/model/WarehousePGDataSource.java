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
package org.jkiss.dbeaver.ext.warehousepg.model;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.ext.greenplum.model.GreenplumDataSource;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.osgi.framework.Version;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * EDB WarehousePG data source.
 * <p>
 * WarehousePG 7 reports its version in the Greenplum format
 * ({@code Greenplum Database 7.5.0-WHPG}), which {@link GreenplumDataSource} already parses.
 * A {@code WarehousePG x.y.z} version string, if present, takes precedence.
 */
public class WarehousePGDataSource extends GreenplumDataSource {

    private static final Pattern WAREHOUSEPG_VERSION_PATTERN = Pattern.compile("WarehousePG(?: Database)? ([0-9]+(?:\\.[0-9]+){0,2})");

    public WarehousePGDataSource(DBRProgressMonitor monitor, DBPDataSourceContainer container) throws DBException {
        super(monitor, container);
    }

    @Override
    public void initialize(@NotNull DBRProgressMonitor monitor) throws DBException {
        super.initialize(monitor);
        if (serverVersion != null) {
            Matcher matcher = WAREHOUSEPG_VERSION_PATTERN.matcher(serverVersion);
            if (matcher.find()) {
                gpVersion = new Version(matcher.group(1));
            }
        }
    }
}

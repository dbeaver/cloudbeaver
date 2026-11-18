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
package io.cloudbeaver.service.dbadmin.model;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.util.List;

/**
 * Locks requested or held by one session
 */
public class WebDBAdminLockItemList {

    @Nullable
    private final String sessionId;
    @NotNull
    private final List<WebDBAdminColumn> columns;
    @NotNull
    private final List<WebDBAdminRow> items;

    public WebDBAdminLockItemList(
        @Nullable String sessionId,
        @NotNull List<WebDBAdminColumn> columns,
        @NotNull List<WebDBAdminRow> items
    ) {
        this.sessionId = sessionId;
        this.columns = columns;
        this.items = items;
    }

    @Nullable
    public String getSessionId() {
        return sessionId;
    }

    @NotNull
    public List<WebDBAdminColumn> getColumns() {
        return columns;
    }

    @NotNull
    public List<WebDBAdminRow> getItems() {
        return items;
    }
}

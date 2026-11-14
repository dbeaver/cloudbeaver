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
 * Lock wait
 */
public class WebDBAdminLock extends WebDBAdminRow {

    @NotNull
    private final String lockId;
    @Nullable
    private final String holdLockId;
    @Nullable
    private final String title;

    public WebDBAdminLock(
        @NotNull String lockId,
        @Nullable String holdLockId,
        @Nullable String title,
        @NotNull List<String> values
    ) {
        super(values);
        this.lockId = lockId;
        this.holdLockId = holdLockId;
        this.title = title;
    }

    @NotNull
    public String getLockId() {
        return lockId;
    }

    @Nullable
    public String getHoldLockId() {
        return holdLockId;
    }

    @Nullable
    public String getTitle() {
        return title;
    }
}

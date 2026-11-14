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

/**
 * Locks of the waiting and the holding session of a lock wait
 */
public class WebDBAdminLockDetails {

    @NotNull
    private final WebDBAdminLockItemList waiting;
    @NotNull
    private final WebDBAdminLockItemList holding;

    public WebDBAdminLockDetails(@NotNull WebDBAdminLockItemList waiting, @NotNull WebDBAdminLockItemList holding) {
        this.waiting = waiting;
        this.holding = holding;
    }

    @NotNull
    public WebDBAdminLockItemList getWaiting() {
        return waiting;
    }

    @NotNull
    public WebDBAdminLockItemList getHolding() {
        return holding;
    }
}

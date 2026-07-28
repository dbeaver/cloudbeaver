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
import org.jkiss.code.Nullable;
import org.jkiss.utils.CommonUtils;

public enum AutoCommitMode {
    DEFAULT("Default", null),
    AUTO_COMMIT("Auto commit", true),
    MANUAL_COMMIT("Manual commit", false);

    private final String title;
    private final Boolean value;

    AutoCommitMode(@NotNull String title, @Nullable Boolean value) {
        this.title = title;
        this.value = value;
    }

    @NotNull
    @Override
    public String toString() {
        return title;
    }

    @Nullable
    public Boolean getValue() {
        return value;
    }

    @NotNull
    public static AutoCommitMode fromValue(@Nullable Boolean value) {
        if (value == null) {
            return DEFAULT;
        }
        return value ? AUTO_COMMIT : MANUAL_COMMIT;
    }

    @Nullable
    public static Boolean from(@Nullable String mode) {
        if (CommonUtils.isEmpty(mode)) {
            return null;
        }
        return valueOf(mode).getValue();
    }
}

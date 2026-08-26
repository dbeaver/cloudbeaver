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
import org.jkiss.dbeaver.model.meta.Property;

public class WebSQLReferenceColumnMapping {

    private final int sourceColumnIndex;
    @NotNull
    private final String sourceColumnName;
    private final int targetColumnIndex;
    @NotNull
    private final String targetColumnName;

    public WebSQLReferenceColumnMapping(
        int sourceColumnIndex,
        @NotNull String sourceColumnName,
        int targetColumnIndex,
        @NotNull String targetColumnName
    ) {
        this.sourceColumnIndex = sourceColumnIndex;
        this.sourceColumnName = sourceColumnName;
        this.targetColumnIndex = targetColumnIndex;
        this.targetColumnName = targetColumnName;
    }

    @Property
    public int getSourceColumnIndex() {
        return sourceColumnIndex;
    }

    @NotNull
    @Property
    public String getSourceColumnName() {
        return sourceColumnName;
    }

    @Property
    public int getTargetColumnIndex() {
        return targetColumnIndex;
    }

    @NotNull
    @Property
    public String getTargetColumnName() {
        return targetColumnName;
    }
}

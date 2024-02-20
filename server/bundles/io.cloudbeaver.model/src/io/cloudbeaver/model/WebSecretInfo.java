/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.secret.DBSSecretValue;

public class WebSecretInfo {
    private final DBSSecretValue secretValue;

    public WebSecretInfo(DBSSecretValue secretValue) {
        this.secretValue = secretValue;
    }

    @Property
    public String getDisplayName() {
        return secretValue.getDisplayName();
    }

    @Property
    public String getSecretId() {
        return buildComplexSecretId(secretValue);
    }

    public static String buildComplexSecretId(@NotNull DBSSecretValue secretValue) {
        return secretValue.getId() + "_" + secretValue.getSubjectId();
    }
}

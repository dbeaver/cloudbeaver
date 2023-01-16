/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
package io.cloudbeaver;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * User identity provided by auth provider.
 */
public class DBWUserIdentity {
    @NotNull
    private final String id;
    @NotNull
    private final String displayName;

    private final Map<String, String> metaParameters = new LinkedHashMap<>();
    @Nullable
    private String providedUserRole;
    @Nullable
    private String[] providedTeamIds;

    public DBWUserIdentity(@NotNull String id, @NotNull String displayName) {
        this(id, displayName, Map.of());
    }

    public DBWUserIdentity(
        @NotNull String id,
        @NotNull String displayName,
        @NotNull Map<String, String> metaParameters
    ) {
        this.id = id;
        this.displayName = displayName;
        this.metaParameters.putAll(metaParameters);
    }

    @NotNull
    public String getId() {
        return id;
    }

    @NotNull
    public String getDisplayName() {
        return displayName;
    }

    @NotNull
    public Map<String, String> getMetaParameters() {
        return Map.copyOf(metaParameters);
    }

    public void setMetaParameter(@NotNull String name, @Nullable String value) {
        if (value == null) {
            metaParameters.remove(name);
        } else {
            metaParameters.put(name, value);
        }
    }

    @Nullable
    public String getProvidedUserRole() {
        return providedUserRole;
    }

    public void setProvidedUserRole(@Nullable String providedUserRole) {
        this.providedUserRole = providedUserRole;
    }

    @Nullable
    public String[] getProvidedTeamIds() {
        return providedTeamIds;
    }

    public void setProvidedTeamIds(@Nullable String[] providedTeamIds) {
        this.providedTeamIds = providedTeamIds;
    }
}

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
package io.cloudbeaver.model.user;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.security.user.SMUser;

import java.util.Collections;
import java.util.Map;

/**
 * Web user.
 */
public class WebUser {
    @NotNull
    private final SMUser user;
    private String displayName;

    public WebUser(@NotNull SMUser smUser) {
        this.user = smUser;
    }

    @NotNull
    public String getUserId() {
        return user.getUserId();
    }

    /**
     * User display name may be set by 3rd party auth providers
     */
    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public boolean getEnabled() {
        return user.isEnabled();
    }

    public void setEnabled(boolean enabled) {
        user.enableUser(enabled);
    }

    public Map<String, String> getMetaParameters() {
        return Collections.unmodifiableMap(user.getMetaParameters());
    }

    public void setMetaParameter(String name, String value) {
        user.setMetaParameter(name, value);
    }

    public Map<String, Object> getConfigurationParameters() {
        return Collections.emptyMap();
    }

    public String[] getTeams() {
        return user.getUserTeams();
    }

    @Override
    public int hashCode() {
        return user.getUserId().hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof WebUser && ((WebUser) obj).user.getUserId().equals(this.user.getUserId());
    }

    @Override
    public String toString() {
        return user.getUserId();
    }

    public String getAuthRole() {
        return user.getAuthRole();
    }
}

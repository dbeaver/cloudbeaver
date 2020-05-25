/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
import org.jkiss.dbeaver.Log;

import java.util.*;

/**
 * Web user.
 */
public class WebUser implements WebAuthSubject {

    private static final Log log = Log.getLog(WebUser.class);

    @NotNull
    private final String userId;
    private String displayName;

    private Map<String, Object> metaParameters = new LinkedHashMap<>();
    private Map<String, Object> configurationParameters = new LinkedHashMap<>();

    private WebRole[] roles = null;

    private String activeAuthModel;
    private Map<String, Map<String, Object>> authCredentials = new HashMap<>();

    public WebUser(@NotNull String userId) {
        this.userId = userId;
    }

    @NotNull
    public String getUserId() {
        return userId;
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

    public String[] getGrantedRoles() {
        return Arrays.stream(roles).map(WebRole::getRoleId).toArray(String[]::new);
    }

    public Map<String, Object> getMetaParameters() {
        return Collections.unmodifiableMap(metaParameters);
    }

    public Map<String, Object> getConfigurationParameters() {
        return Collections.unmodifiableMap(configurationParameters);
    }

    public WebRole[] getRoles() {
        return roles;
    }

    public void setRoles(WebRole[] roles) {
        this.roles = roles;
    }

    @Override
    public int hashCode() {
        return userId.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof WebUser && ((WebUser) obj).userId.equals(this.userId);
    }

    @Override
    public String toString() {
        return userId;
    }

    @Override
    public String getSubjectId() {
        return getUserId();
    }
}

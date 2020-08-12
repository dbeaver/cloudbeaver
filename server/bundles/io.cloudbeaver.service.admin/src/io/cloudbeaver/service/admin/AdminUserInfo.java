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
package io.cloudbeaver.service.admin;

import io.cloudbeaver.DBWConnectionGrant;
import io.cloudbeaver.model.user.WebRole;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.meta.Property;

import java.util.Map;

/**
 * Web user info
 */
public class AdminUserInfo {

    private final WebUser user;

    private Map<String, Object> metaParameters;
    private Map<String, Object> configurationParameters;

    public AdminUserInfo(WebUser user) {
        this.user = user;
    }

    @Property
    public String getUserId() {
        return user.getUserId();
    }

    @Property
    public Map<String, Object> getMetaParameters() {
        return metaParameters;
    }

    @Property
    public Map<String, Object> getConfigurationParameters() {
        return configurationParameters;
    }

    @Property
    public String[] getGrantedRoles() throws DBCException {
        if (user.getRoles() == null) {
            WebRole[] userRoles = CBPlatform.getInstance().getApplication().getSecurityController().getUserRoles(getUserId());
            user.setRoles(userRoles);
        }
        return user.getGrantedRoles();
    }

    @Property
    public DBWConnectionGrant[] getGrantedConnections() throws DBCException {
        return CBPlatform.getInstance().getApplication().getSecurityController().getSubjectConnectionAccess(new String[] { getUserId()} );
    }

}

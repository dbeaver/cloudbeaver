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
package io.cloudbeaver.server.events;

import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebHeadlessSession;
import io.cloudbeaver.service.security.SMUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.event.permissions.WSSubjectPermissionEvent;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.util.HashSet;

public class WSSubjectPermissionUpdatedEventHandler extends WSDefaultEventHandler<WSSubjectPermissionEvent> {
    private static final Log log = Log.getLog(WSSubjectPermissionUpdatedEventHandler.class);

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSSubjectPermissionEvent event) {
        var oldUserPermissions = new HashSet<>(activeUserSession.getUserContext().getUserPermissions());
        try {
            activeUserSession.getUserContext().refreshSMSession();
        } catch (DBException e) {
            activeUserSession.addSessionError(e);
            log.error("Error refreshing session", e);
        }
        activeUserSession.refreshUserData();
        var newUserPermissions = activeUserSession.getUserContext().getUserPermissions();
        boolean shouldUpdateData = activeUserSession instanceof WebHeadlessSession
            || !(SMUtils.isRMAdmin(oldUserPermissions) && SMUtils.isRMAdmin(newUserPermissions));
        if (shouldUpdateData) {
            super.updateSessionData(activeUserSession, event);
        }
    }

    @Override
    protected boolean isAcceptableInSession(@NotNull BaseWebSession activeUserSession, @NotNull WSSubjectPermissionEvent event) {
        if (!super.isAcceptableInSession(activeUserSession, event)) {
            return false;
        }
        var user = activeUserSession.getUserContext().getUser();
        if (user == null) {
            return false;
        }
        var subjectId = event.getSubjectId();
        switch (event.getSubjectType()) {
            case user:
                return CommonUtils.equalObjects(user.getUserId(), subjectId);
            case team:
                return ArrayUtils.containsIgnoreCase(user.getTeams(), subjectId);
            default:
                return false;
        }
    }
}

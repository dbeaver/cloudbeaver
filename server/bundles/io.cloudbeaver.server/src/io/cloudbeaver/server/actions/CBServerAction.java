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
package io.cloudbeaver.server.actions;

import io.cloudbeaver.model.session.WebSession;

import java.util.Map;

/**
 * Server custom action
 */
public class CBServerAction {

    private static final String PARAM_ACTION_PARAMETERS = "server-action";

    private final String actionId;
    private final Map<String, Object> parameters;

    public CBServerAction(String actionId, Map<String, Object> parameters) {
        this.actionId = actionId;
        this.parameters = parameters;
    }

    public String getActionId() {
        return actionId;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public <T> T getParameter(String param) {
        return (T)parameters.get(param);
    }

    public void saveInSession(WebSession session) {
        session.setAttribute(PARAM_ACTION_PARAMETERS, this, true);
    }

    public static CBServerAction fromSession(WebSession session, boolean remove) {
        CBServerAction action = session.getAttribute(PARAM_ACTION_PARAMETERS);
        if (action != null && remove) {
            removeAction(session);
        }
        return action;
    }

    public static void removeAction(WebSession session) {
        session.removeAttribute(PARAM_ACTION_PARAMETERS);
    }


}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp
 *
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
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

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
package io.cloudbeaver.server;

import io.cloudbeaver.model.session.WebSession;

import java.util.Map;

/**
 * Server custom action
 */
public class CBServerAction {

    private final String actionId;
    private final Map<String, String> parameters;

    public CBServerAction(String actionId, Map<String, String> parameters) {
        this.actionId = actionId;
        this.parameters = parameters;
    }

    public String getActionId() {
        return actionId;
    }

    public Map<String, String> getParameters() {
        return parameters;
    }

    public String getParameter(String param) {
        return parameters.get(param);
    }

    public void saveInSession(WebSession session, String actionType) {
        session.setAttribute(actionType, this);
    }

    public static CBServerAction fromSession(WebSession session, String actionType, boolean remove) {
        CBServerAction action = session.getAttribute(actionType);
        if (action != null && remove) {
            session.removeAttribute(actionType);
        }
        return action;
    }


}

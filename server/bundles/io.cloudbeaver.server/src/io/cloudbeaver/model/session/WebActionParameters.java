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
package io.cloudbeaver.model.session;

import java.util.Map;

/**
 * Web action parameters
 */
public class WebActionParameters {

    private static final String PARAM_ACTION_PARAMETERS = "action-parameters";

    private final Map<String, Object> parameters;

    private WebActionParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public static void saveToSession(WebSession session, Map<String, Object> parameters) {
        session.setAttribute(PARAM_ACTION_PARAMETERS, new WebActionParameters(parameters));
    }

    public static WebActionParameters fromSession(WebSession session, boolean remove) {
        WebActionParameters action = session.getAttribute(PARAM_ACTION_PARAMETERS);
        if (action != null && remove) {
            session.removeAttribute(PARAM_ACTION_PARAMETERS);
        }
        return action;
    }


}

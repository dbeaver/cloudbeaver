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

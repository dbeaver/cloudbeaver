/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.service.auth.handler;

import io.cloudbeaver.DBWebException;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.WSAbstractEvent;

import java.util.List;

public class WebSessionAuthEvent extends WSAbstractEvent {
    @Nullable
    private final List<WebUserAuthTokenInfo> userTokens;

    private final DBWebException error;

    protected WebSessionAuthEvent(@NotNull List<WebUserAuthTokenInfo> userTokens) {
        super("cb_web_session_auth", WSConstants.TOPIC_SESSION);
        this.userTokens = userTokens;
       this.error = null;
    }
    protected WebSessionAuthEvent(@NotNull DBWebException error) {
        super("cb_web_session_auth", WSConstants.TOPIC_SESSION);
        this.userTokens = null;
        this.error = error;
    }

    @Nullable
    public List<WebUserAuthTokenInfo> getUserTokens() {
        return userTokens;
    }

    public DBWebException getError() {
        return error;
    }
}

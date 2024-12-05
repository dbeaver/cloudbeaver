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

import io.cloudbeaver.model.WebServerMessage;
import io.cloudbeaver.model.app.ServletAuthApplication;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMSessionPrincipal;

/**
 * Headless CB web session
 */
public class WebHeadlessSession extends BaseWebSession {
    public WebHeadlessSession(
        @NotNull String id,
        @NotNull ServletAuthApplication application
    ) throws DBException {
        super(id, application);
    }

    @Override
    public void addSessionError(Throwable exception) {

    }

    @Override
    public void addSessionMessage(WebServerMessage message) {

    }

    @Nullable
    @Override
    public SMSessionPrincipal getSessionPrincipal() {
        return null;
    }
}

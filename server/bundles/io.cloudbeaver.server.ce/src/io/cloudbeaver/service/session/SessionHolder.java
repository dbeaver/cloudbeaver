/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.service.session;

import io.cloudbeaver.model.session.BaseWebSession;
import org.jkiss.code.NotNull;

public class SessionHolder {
    private final SessionType sessionType;
    private final BaseWebSession session;

    public SessionHolder(@NotNull SessionType sessionType, @NotNull BaseWebSession session) {
        this.sessionType = sessionType;
        this.session = session;
    }

    @NotNull
    public SessionType getSessionType() {
        return sessionType;
    }

    @NotNull
    public BaseWebSession getSession() {
        return session;
    }
}

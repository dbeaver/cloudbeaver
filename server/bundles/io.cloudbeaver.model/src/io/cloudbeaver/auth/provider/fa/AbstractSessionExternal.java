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

package io.cloudbeaver.auth.provider.fa;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.auth.*;

import java.time.LocalDateTime;
import java.util.Map;

public abstract class AbstractSessionExternal implements SMSessionExternal {

    @NotNull
    protected final Map<String, Object> authParameters;
    @NotNull
    protected final SMSession parentSession;
    @NotNull
    protected final SMAuthSpace space;

    protected AbstractSessionExternal(
        @NotNull SMSession parentSession,
        @NotNull SMAuthSpace space,
        @NotNull Map<String, Object> authParameters
    ) {
        this.parentSession = parentSession;
        this.space = space;
        this.authParameters = authParameters;
    }

    @NotNull
    @Override
    public SMAuthSpace getSessionSpace() {
        return space;
    }

    @NotNull
    @Override
    public SMSessionContext getSessionContext() {
        return this.parentSession.getSessionContext();
    }

    @Nullable
    @Override
    public SMSessionPrincipal getSessionPrincipal() {
        return parentSession.getSessionPrincipal();
    }

    @NotNull
    @Override
    public LocalDateTime getSessionStart() {
        return parentSession.getSessionStart();
    }

    @Override
    public void close() {
        // do nothing
    }

    @Override
    public Map<String, Object> getAuthParameters() {
        return authParameters;
    }
}

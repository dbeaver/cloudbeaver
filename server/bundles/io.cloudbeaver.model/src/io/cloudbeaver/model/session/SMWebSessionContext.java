/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMAuthSpace;
import org.jkiss.dbeaver.model.auth.SMAuthToken;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

public class SMWebSessionContext implements SMSessionContext {

    private final WebSession session;
    private final SMSessionContext parentContext;

    public SMWebSessionContext(SMSessionContext parentContext, WebSession session) {
        this.parentContext = parentContext;
        this.session = session;
    }

    @Nullable
    @Override
    public SMSession getSpaceSession(@NotNull DBRProgressMonitor monitor, @NotNull SMAuthSpace space, boolean open) throws DBException {
        return parentContext.getSpaceSession(monitor, session.getSessionSpace(), open);
    }

    @Nullable
    @Override
    public SMSession findSpaceSession(@NotNull SMAuthSpace space) {
        return parentContext.findSpaceSession(session.getSessionSpace());
    }

    @Override
    public SMAuthToken[] getSavedTokens() {
        return parentContext.getSavedTokens();
    }

    @Override
    public void addSession(@NotNull SMSession session) {
        parentContext.addSession(session);
    }

    @Override
    public boolean removeSession(@NotNull SMSession session) {
        return parentContext.removeSession(session);
    }
}

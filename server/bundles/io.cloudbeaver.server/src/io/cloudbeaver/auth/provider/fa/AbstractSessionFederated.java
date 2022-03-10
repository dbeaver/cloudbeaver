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

package io.cloudbeaver.auth.provider.fa;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.*;

import java.util.Map;

public abstract class AbstractSessionFederated implements SMSessionFederated {

    @NotNull
    protected final Map<String, Object> authParameters;
    @NotNull
    protected final SMSession parentSession;
    @NotNull
    protected final SMAuthSpace space;

    protected AbstractSessionFederated(@NotNull SMSession parentSession, @NotNull SMAuthSpace space, @NotNull Map<String, Object> authParameters) {
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

    @Override
    public SMSessionPrincipal getSessionPrincipal() {
        return parentSession.getSessionPrincipal();
    }

    @Override
    public boolean isApplicationSession() {
        return false;
    }

    @Nullable
    @Override
    public DBPProject getSingletonProject() {
        return parentSession.getSingletonProject();
    }

    public void close() {
        // do nothing
    }

}

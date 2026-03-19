/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp
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
package io.cloudbeaver.server.websockets.lsp;

import io.cloudbeaver.model.session.BaseWebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.impl.AbstractSessionPersistent;
import org.jkiss.dbeaver.model.lsp.DBLServerSessionProvider;

public class LSPWebServerSessionProvider implements DBLServerSessionProvider {

    @NotNull
    private final BaseWebSession session;

    public LSPWebServerSessionProvider(@NotNull BaseWebSession session) {
        this.session = session;
    }

    @Nullable
    @Override
    public AbstractSessionPersistent getSession() {
        return session;
    }

    @NotNull
    @Override
    public DBPWorkspace getWorkspace() {
        return session.getWorkspace();
    }
}

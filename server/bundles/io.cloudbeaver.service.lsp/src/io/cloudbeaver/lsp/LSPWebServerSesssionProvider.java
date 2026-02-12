package io.cloudbeaver.lsp;

import io.cloudbeaver.model.session.BaseWebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.impl.AbstractSessionPersistent;
import org.jkiss.dbeaver.model.lsp.DBLServerSessionProvider;

public class LSPWebServerSesssionProvider implements DBLServerSessionProvider {

    @NotNull
    private final BaseWebSession session;

    public LSPWebServerSesssionProvider(@NotNull BaseWebSession session) {
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

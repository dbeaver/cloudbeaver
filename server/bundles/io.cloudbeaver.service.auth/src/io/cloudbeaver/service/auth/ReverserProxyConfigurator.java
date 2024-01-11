package io.cloudbeaver.service.auth;

import io.cloudbeaver.model.app.WebAppConfiguration;
import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWServiceServerConfigurator;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;

public class ReverserProxyConfigurator implements DBWServiceServerConfigurator {
    @Override
    public void configureServer(@NotNull WebApplication application, @Nullable WebSession session, @NotNull WebAppConfiguration appConfig) throws DBException {

    }

    @Override
    public void migrateConfigurationIfNeeded(@NotNull WebApplication application) throws DBException {
        DBWServiceServerConfigurator.super.migrateConfigurationIfNeeded(application); //
    }

    @Override
    public void reloadConfiguration(@NotNull WebAppConfiguration appConfig) throws DBException {

    }
}

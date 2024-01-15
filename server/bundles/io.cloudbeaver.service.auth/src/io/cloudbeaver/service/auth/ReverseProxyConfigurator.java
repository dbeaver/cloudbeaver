package io.cloudbeaver.service.auth;

import io.cloudbeaver.auth.provider.rp.RPAuthProvider;
import io.cloudbeaver.model.app.WebAppConfiguration;
import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.app.WebAuthApplication;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWServiceServerConfigurator;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;

import java.util.HashMap;
import java.util.Map;

public class ReverseProxyConfigurator implements DBWServiceServerConfigurator {
    private static final Log log = Log.getLog(ReverseProxyConfigurator.class);

    @Override
    public void configureServer(@NotNull WebApplication application, @Nullable WebSession session, @NotNull WebAppConfiguration appConfig) throws DBException {

    }

    @Override
    public void migrateConfigurationIfNeeded(@NotNull WebApplication application) throws DBException {
        if (migrationNotNeeded(application)) {
            return;
        }
        migrateConfiguration(application);
    }

    @Override
    public void reloadConfiguration(@NotNull WebAppConfiguration appConfig) throws DBException {

    }

    private void migrateConfiguration(
        @NotNull WebApplication application
    ) {
        if (!(application instanceof WebAuthApplication authApplication)) {
            return;
        }

        SMAuthProviderCustomConfiguration smReverseProxyhProviderConfiguration =
            authApplication.getAuthConfiguration().getAuthProviderConfiguration(RPAuthProvider.AUTH_PROVIDER);
        boolean createNew = false;
        if (smReverseProxyhProviderConfiguration == null) {
            createNew = true;
            smReverseProxyhProviderConfiguration = new SMAuthProviderCustomConfiguration(RPAuthProvider.AUTH_PROVIDER);
            smReverseProxyhProviderConfiguration.setProvider(RPAuthProvider.AUTH_PROVIDER);
            smReverseProxyhProviderConfiguration.setDisplayName("Reverse Proxy");
            smReverseProxyhProviderConfiguration.setDescription(
                "Automatically created provider after changing Reverse Proxy configuration way in 23.3.3 version"
            );
            smReverseProxyhProviderConfiguration.setIconURL("");
            Map<String, Object> parameters = new HashMap<>();
            parameters.put(RPConstants.PARAM_USER, RPAuthProvider.X_USER);
            parameters.put(RPConstants.PARAM_LOGOUT_URL, RPAuthProvider.X_LOGOUT_URL);
            parameters.put(RPConstants.PARAM_TEAM, RPAuthProvider.X_LOGOUT_URL);
            parameters.put(RPConstants.PARAM_FIRST_NAME, RPAuthProvider.X_FIRST_NAME);
            parameters.put(RPConstants.PARAM_LAST_NAME, RPAuthProvider.X_LAST_NAME);
            smReverseProxyhProviderConfiguration.setParameters(parameters);
        }

        if (createNew) {
            authApplication.getAuthConfiguration().addAuthProviderConfiguration(smReverseProxyhProviderConfiguration);
            try {
                authApplication.flushConfiguration();
            } catch (Exception e) {
                log.error("Failed to save server configuration", e);
            }
        }
    }

    private boolean migrationNotNeeded(@NotNull WebApplication application) {
        if (!(application instanceof WebAuthApplication authApplication)) {
            return true;
        }

        if (!authApplication.getAuthConfiguration().isAuthProviderEnabled(RPAuthProvider.AUTH_PROVIDER)) {
            log.debug("Reverse proxy provider disabled, migration not needed");
            return true;
        }
        return false;
    }
}

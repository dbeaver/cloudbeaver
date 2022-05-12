package io.cloudbeaver.model.app;

import org.jkiss.code.NotNull;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public abstract class BaseWebAppConfiguration implements WebAppConfiguration {
    public static final String DEFAULT_APP_ANONYMOUS_ROLE_NAME = "user";

    protected final Map<String, Object> plugins;
    protected boolean anonymousAccessEnabled;
    protected String anonymousUserRole;
    protected String defaultUserRole;

    public BaseWebAppConfiguration() {
        this.plugins = new LinkedHashMap<>();
        this.anonymousAccessEnabled = true;
        this.anonymousUserRole = DEFAULT_APP_ANONYMOUS_ROLE_NAME;
        this.defaultUserRole = DEFAULT_APP_ANONYMOUS_ROLE_NAME;

    }

    public BaseWebAppConfiguration(BaseWebAppConfiguration src) {
        this.plugins = new LinkedHashMap<>(src.plugins);
        this.anonymousAccessEnabled = src.anonymousAccessEnabled;
        this.anonymousUserRole = src.anonymousUserRole;
        this.defaultUserRole = src.defaultUserRole;
    }

    @Override
    public boolean isAnonymousAccessEnabled() {
        return anonymousAccessEnabled;
    }

    @Override

    public String getAnonymousUserRole() {
        return anonymousUserRole;
    }

    @Override

    public String getDefaultUserRole() {
        return defaultUserRole;
    }


    @Override
    public <T> T getPluginOption(@NotNull String pluginId, @NotNull String option) {
        return (T) getPluginConfig(pluginId, false).get(option);
    }

    @Override
    public Map<String, Object> getPluginConfig(@NotNull String pluginId, boolean create) {
        Object config = plugins.get(pluginId);
        if (config instanceof Map) {
            return (Map<String, Object>) config;
        } else {
            if (create) {
                Map<String, Object> newConfig = new LinkedHashMap<>();
                plugins.put(pluginId, newConfig);
                return newConfig;
            } else {
                return Collections.emptyMap();
            }
        }
    }
}

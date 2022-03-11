package io.cloudbeaver.model.app;

import org.jkiss.dbeaver.model.app.DBPApplication;

public interface WebApplication extends DBPApplication {
    boolean isConfigurationMode();

    WebAppConfiguration getAppConfiguration();
}

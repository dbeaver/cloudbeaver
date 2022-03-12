package io.cloudbeaver.model.app;

import org.jkiss.dbeaver.model.app.DBPApplication;

import java.io.File;

public interface WebApplication extends DBPApplication {
    boolean isConfigurationMode();

    WebAppConfiguration getAppConfiguration();

    File getDataDirectory(boolean create);

    File getHomeDirectory();
}

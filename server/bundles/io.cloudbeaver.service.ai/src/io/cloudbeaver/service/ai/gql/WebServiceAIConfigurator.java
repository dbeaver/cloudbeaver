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
package io.cloudbeaver.service.ai.gql;

import io.cloudbeaver.model.app.ServletAppConfiguration;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.app.ServletServerConfiguration;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWServiceServerConfigurator;
import io.cloudbeaver.service.ai.WebAIFeatureProvider;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.ai.registry.AISettingsManager;
import org.jkiss.dbeaver.model.websocket.event.WSWorkspaceConfigurationChangedEvent;

public class WebServiceAIConfigurator implements DBWServiceServerConfigurator {
    @Override
    public void configureServer(
        @NotNull ServletApplication application,
        @Nullable WebSession session,
        @NotNull ServletServerConfiguration serverConfiguration,
        @NotNull ServletAppConfiguration appConfig
    ) throws DBException {
        var aiDisabled = !appConfig.isFeatureEnabled(WebAIFeatureProvider.AI_FEATURE_ID);

        if (aiDisabled && !AISettingsManager.isConfigExists()) {
            // do nothing, ai disabled and settings not exists
            return;
        }
        var settings = AISettingsManager.getInstance().getSettings();
        settings.setAiDisabled(aiDisabled);
        application.getEventController().addEvent(
            new WSWorkspaceConfigurationChangedEvent(
                AISettingsManager.AI_CONFIGURATION_FILE_NAME,
                null,
                null
            )
        );
    }


    @Override
    public void migrateConfigurationIfNeeded(@NotNull ServletApplication application) throws DBException {

    }

    @Override
    public void reloadConfiguration(@NotNull ServletAppConfiguration appConfig) throws DBException {

    }
}

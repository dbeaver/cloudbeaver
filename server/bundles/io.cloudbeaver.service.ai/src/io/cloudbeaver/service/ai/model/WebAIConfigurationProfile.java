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
package io.cloudbeaver.service.ai.model;

import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.ai.AIConfigurationProfile;

public class WebAIConfigurationProfile {

    @NotNull
    private final transient WebSession webSession;
    @NotNull
    private final AIConfigurationProfile profile;

    public WebAIConfigurationProfile(@NotNull WebSession webSession, @NotNull AIConfigurationProfile profile) {
        this.webSession = webSession;
        this.profile = profile;
    }

    @NotNull
    public String getId() {
        return profile.getProfileId();
    }

    @NotNull
    public String getName() {
        return profile.getProfileName();
    }

    @NotNull
    public String getEngineId() {
        return profile.getEngineId();
    }

    @NotNull
    public WebPropertyInfo[] getConfiguration() throws DBException {
        return WebServiceUtils.getObjectFilteredProperties(webSession, profile.getConfiguration(), null);
    }
}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.model;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.dbeaver.model.connection.DBPAuthModelDescriptor;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.preferences.DBPPropertySource;

import java.util.Arrays;

/**
 * WebDatabaseAuthModel
 */
public class WebDatabaseAuthModel {

    private WebSession webSession;
    private DBPAuthModelDescriptor model;

    public WebDatabaseAuthModel(WebSession webSession, DBPAuthModelDescriptor model) {
        this.webSession = webSession;
        this.model = model;
    }

    @Property
    public String getId() {
        return model.getId();
    }

    @Property
    public String getDisplayName() {
        return model.getName();
    }

    @Property
    public String getDescription() {
        return model.getDescription();
    }

    @Property
    public String getIcon() {
        return WebServiceUtils.makeIconId(model.getIcon());
    }

    @Property
    public boolean getRequiresLocalConfiguration() {
        return model.requiresLocalConfiguration();
    }

    @Property
    public WebPropertyInfo[] getProperties() throws DBWebException {
        boolean hasContextCredentials = webSession.hasContextCredentials();

        DBPPropertySource credentialsSource = model.createCredentialsSource(null, null);
        return Arrays.stream(credentialsSource.getProperties())
            .filter(p -> WebServiceUtils.isAuthPropertyApplicable(p, hasContextCredentials))
            .map(p -> new WebPropertyInfo(webSession, p, credentialsSource)).toArray(WebPropertyInfo[]::new);
    }


}

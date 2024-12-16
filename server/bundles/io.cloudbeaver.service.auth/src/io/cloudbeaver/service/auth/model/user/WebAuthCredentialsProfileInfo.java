/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.service.auth.model.user;

import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import org.jkiss.dbeaver.model.security.SMAuthCredentialsProfile;

import java.util.List;

public class WebAuthCredentialsProfileInfo {
    private final SMAuthCredentialsProfile profile;
    private final WebSession webSession;

    public WebAuthCredentialsProfileInfo(WebSession webSession, SMAuthCredentialsProfile profile) {
        this.profile = profile;
        this.webSession = webSession;
    }

    public String getId() {
        return profile.getId();
    }

    public String getLabel() {
        return profile.getLabel();
    }

    public String getDescription() {
        return profile.getDescription();
    }

    public List<WebPropertyInfo> getCredentialParameters() {
        return profile.getCredentialParameters().stream().map(p -> new WebPropertyInfo(webSession, p)).toList();
    }
}

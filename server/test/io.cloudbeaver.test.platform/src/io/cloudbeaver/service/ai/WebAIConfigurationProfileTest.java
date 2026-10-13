/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.service.ai;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.ai.model.WebAIConfigurationProfile;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.ai.AIConfigurationProfile;
import org.jkiss.dbeaver.model.ai.engine.AIAccountProperties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

public class WebAIConfigurationProfileTest {

    @Test
    public void exposesAvailableDeviceAuthorization() throws DBException {
        WebAIConfigurationProfile profile = createProfile(false, true);

        Assertions.assertTrue(profile.isDeviceAuthorizationAvailable());
        Assertions.assertEquals("Test provider", profile.getAccountProvider());
    }

    @Test
    public void hidesUnsupportedDeviceAuthorization() throws DBException {
        WebAIConfigurationProfile profile = createProfile(false, false);

        Assertions.assertFalse(profile.isDeviceAuthorizationAvailable());
        Assertions.assertNull(profile.getAccountProvider());
    }

    @Test
    public void hidesDeviceAuthorizationForGlobalProfile() throws DBException {
        WebAIConfigurationProfile profile = createProfile(true, true);

        Assertions.assertFalse(profile.isDeviceAuthorizationAvailable());
        Assertions.assertNull(profile.getAccountProvider());
    }

    private static WebAIConfigurationProfile createProfile(boolean global, boolean supportsDeviceAuthorization) throws DBException {
        AIAccountProperties properties = Mockito.mock(AIAccountProperties.class);
        Mockito.when(properties.supportsDeviceAuthorization()).thenReturn(supportsDeviceAuthorization);
        Mockito.when(properties.getAccountAuthenticationProviderName()).thenReturn("Test provider");

        AIConfigurationProfile profile = Mockito.mock(AIConfigurationProfile.class);
        Mockito.when(profile.isGlobal()).thenReturn(global);
        Mockito.when(profile.getConfiguration()).thenReturn(properties);

        return new WebAIConfigurationProfile(Mockito.mock(WebSession.class), profile);
    }
}

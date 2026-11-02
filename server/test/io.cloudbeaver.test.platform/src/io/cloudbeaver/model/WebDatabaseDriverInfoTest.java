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
package io.cloudbeaver.model;

import io.cloudbeaver.model.session.WebSession;
import org.eclipse.core.runtime.IConfigurationElement;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.impl.ProviderPropertyDescriptor;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

public class WebDatabaseDriverInfoTest {
    @Test
    public void mainFieldsExposeRequiredAndSupportedConfigurationTypes() {
        ProviderPropertyDescriptor main = property("tenant", true);
        ProviderPropertyDescriptor advanced = property("timeout", false);
        DBPDriver driver = Mockito.mock(DBPDriver.class);
        Mockito.when(driver.getFullId()).thenReturn("example:driver");
        Mockito.when(driver.getMainPropertyDescriptors()).thenReturn(new DBPPropertyDescriptor[]{main});
        Mockito.when(driver.getProviderPropertyDescriptors()).thenReturn(new ProviderPropertyDescriptor[]{advanced});
        WebDatabaseDriverInfo info = new WebDatabaseDriverInfo(Mockito.mock(WebSession.class), driver);

        WebPropertyInfo[] mainFields = info.getMainProperties();
        WebPropertyInfo[] advancedFields = info.getProviderProperties();

        Assertions.assertEquals(1, mainFields.length);
        Assertions.assertEquals("tenant", mainFields[0].getId());
        Assertions.assertTrue(mainFields[0].isRequired());
        Assertions.assertArrayEquals(new String[]{"MANUAL"}, mainFields[0].getSupportedConfigurationTypes());
        Assertions.assertEquals(1, advancedFields.length);
        Assertions.assertEquals("timeout", advancedFields[0].getId());
        Assertions.assertFalse(advancedFields[0].isRequired());
    }

    @NotNull
    private static ProviderPropertyDescriptor property(@NotNull String id, boolean required) {
        IConfigurationElement config = Mockito.mock(IConfigurationElement.class);
        Mockito.when(config.getAttribute("id")).thenReturn(id);
        Mockito.when(config.getAttribute("label")).thenReturn(id);
        Mockito.when(config.getAttribute("type")).thenReturn("string");
        Mockito.when(config.getAttribute("required")).thenReturn(Boolean.toString(required));
        Mockito.when(config.getAttribute("supportedConfigurationTypes")).thenReturn("MANUAL");
        return new ProviderPropertyDescriptor("Connection", config);
    }
}

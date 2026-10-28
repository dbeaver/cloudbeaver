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
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.impl.ProviderPropertyDescriptor;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Set;

public class WebDatabaseDriverInfoTest {
    @Test
    public void providerPropertiesExposeDeclaredMetadata() {
        ProviderPropertyDescriptor property = property("tenant", true, "main,custom", null);
        WebPropertyInfo info = info(property);

        Assertions.assertTrue(info.isRequired());
        Assertions.assertArrayEquals(property.getFeatures(), info.getFeatures());
        Assertions.assertTrue(info.hasFeature("main"));
        Assertions.assertTrue(info.hasAnyFeature(List.of("main")));
        Assertions.assertEquals("tenant", info.getId());
        Assertions.assertEquals("Tenant", info.getDisplayName());
        Assertions.assertEquals("Connection", info.getCategory());
        Assertions.assertEquals("String", info.getDataType());
        Assertions.assertEquals(Set.of("MANUAL", "URL"), Set.of(info.getSupportedConfigurationTypes()));
    }

    @Test
    public void optionalAdvancedPropertiesKeepTheirDefaults() {
        WebPropertyInfo info = info(property("timeout", false, null, null));

        Assertions.assertFalse(info.isRequired());
        Assertions.assertArrayEquals(new String[0], info.getFeatures());
        Assertions.assertFalse(info.hasFeature("main"));
    }

    @Test
    public void mainPlacementPreservesOptionalityAndConfigurationTypes() {
        WebPropertyInfo info = info(property("tenant", false, "main", "URL"));

        Assertions.assertFalse(info.isRequired());
        Assertions.assertArrayEquals(new String[]{"main"}, info.getFeatures());
        Assertions.assertArrayEquals(new String[]{"URL"}, info.getSupportedConfigurationTypes());
    }

    @NotNull
    private static ProviderPropertyDescriptor property(
        @NotNull String id,
        boolean required,
        @Nullable String features,
        @Nullable String configurationTypes
    ) {
        IConfigurationElement config = Mockito.mock(IConfigurationElement.class);
        Mockito.when(config.getAttribute("id")).thenReturn(id);
        Mockito.when(config.getAttribute("label")).thenReturn("Tenant");
        Mockito.when(config.getAttribute("type")).thenReturn("string");
        Mockito.when(config.getAttribute("required")).thenReturn(Boolean.toString(required));
        Mockito.when(config.getAttribute("features")).thenReturn(features);
        Mockito.when(config.getAttribute("supportedConfigurationTypes")).thenReturn(configurationTypes);
        return new ProviderPropertyDescriptor("Connection", config);
    }

    @NotNull
    private static WebPropertyInfo info(@NotNull ProviderPropertyDescriptor property) {
        DBPDriver driver = Mockito.mock(DBPDriver.class);
        Mockito.when(driver.getFullId()).thenReturn("example:driver");
        Mockito.when(driver.getProviderPropertyDescriptors()).thenReturn(new ProviderPropertyDescriptor[]{property});
        return new WebDatabaseDriverInfo(Mockito.mock(WebSession.class), driver).getProviderProperties()[0];
    }
}

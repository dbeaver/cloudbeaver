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
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.connection.DBPDriverConfigurationType;
import org.jkiss.dbeaver.model.impl.ProviderPropertyDescriptor;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Set;

public class WebDatabaseDriverInfoTest {
    @Test
    public void organizationIsRequiredOnMainWithoutChangingDriverMetadata() {
        ProviderPropertyDescriptor property = property("influx.org", false, "existing");
        WebPropertyInfo info = info("influxdb2", property);

        Assertions.assertTrue(info.isRequired());
        Assertions.assertArrayEquals(new String[]{"existing", WebPropertyInfo.FEATURE_MAIN}, info.getFeatures());
        Assertions.assertTrue(info.hasFeature(WebPropertyInfo.FEATURE_MAIN));
        Assertions.assertTrue(info.hasAnyFeature(List.of(WebPropertyInfo.FEATURE_MAIN)));
        Assertions.assertEquals("influx.org", info.getId());
        Assertions.assertEquals("Organisation", info.getDisplayName());
        Assertions.assertEquals(Set.of("MANUAL", "URL"), Set.of(info.getSupportedConfigurationTypes()));
        Assertions.assertFalse(property.isRequired());
        Assertions.assertArrayEquals(new String[]{"existing"}, property.getFeatures());
    }

    @Test
    public void otherInfluxPropertiesKeepTheirMetadata() {
        WebPropertyInfo info = info("influxdb2", property("influxdb.timeout.connect", false, "existing"));

        Assertions.assertFalse(info.isRequired());
        Assertions.assertArrayEquals(new String[]{"existing"}, info.getFeatures());
        Assertions.assertFalse(info.hasFeature(WebPropertyInfo.FEATURE_MAIN));
    }

    @Test
    public void samePropertyIdInAnotherProviderIsNotPromoted() {
        WebPropertyInfo info = info("other-provider", property("influx.org", false, "existing"));

        Assertions.assertFalse(info.isRequired());
        Assertions.assertArrayEquals(new String[]{"existing"}, info.getFeatures());
    }

    @Test
    public void existingMainFeatureIsNotDuplicated() {
        WebPropertyInfo info = info("influxdb2", property("influx.org", true, WebPropertyInfo.FEATURE_MAIN));

        Assertions.assertTrue(info.isRequired());
        Assertions.assertArrayEquals(new String[]{WebPropertyInfo.FEATURE_MAIN}, info.getFeatures());
    }

    @NotNull
    private static ProviderPropertyDescriptor property(@NotNull String id, boolean required, @NotNull String... features) {
        ProviderPropertyDescriptor property = Mockito.mock(ProviderPropertyDescriptor.class);
        Mockito.when(property.getId()).thenReturn(id);
        Mockito.when(property.getDisplayName()).thenReturn("Organisation");
        Mockito.when(property.isRequired()).thenReturn(required);
        Mockito.when(property.getFeatures()).thenReturn(features);
        Mockito.when(property.getConfigurationTypes()).thenReturn(
            Set.of(DBPDriverConfigurationType.MANUAL, DBPDriverConfigurationType.URL)
        );
        return property;
    }

    @NotNull
    private static WebPropertyInfo info(@NotNull String providerId, @NotNull ProviderPropertyDescriptor property) {
        DBPDriver driver = Mockito.mock(DBPDriver.class);
        Mockito.when(driver.getFullId()).thenReturn(providerId + ":driver");
        Mockito.when(driver.getProviderId()).thenReturn(providerId);
        Mockito.when(driver.getProviderPropertyDescriptors()).thenReturn(new ProviderPropertyDescriptor[]{property});
        return new WebDatabaseDriverInfo(Mockito.mock(WebSession.class), driver).getProviderProperties()[0];
    }
}

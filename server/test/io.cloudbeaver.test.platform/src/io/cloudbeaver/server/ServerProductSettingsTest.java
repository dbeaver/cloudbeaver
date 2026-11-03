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
package io.cloudbeaver.server;

import io.cloudbeaver.model.config.CBAppConfig;
import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.utils.ServletAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

public class ServerProductSettingsTest {
    @Test
    public void serializesSubmittedDefaultsInsteadOfLiveConfiguration() {
        CBServerConfig live = new CBServerConfig();
        live.getProductSettings().put("core.localization.language", "en");
        CBServerConfig submitted = new CBServerConfig();
        submitted.getProductSettings().put("core.localization.language", "zh");
        submitted.getProductSettings().put("core.theming.theme", "dark");

        TestController controller = Mockito.mock(
            TestController.class,
            Mockito.CALLS_REAL_METHODS
        );
        Mockito.doReturn(live).when(controller).getServerConfiguration();

        Map<String, Object> serialized = controller.collectServerConfigProperties(submitted, Map.of());

        Assertions.assertEquals(submitted.getProductSettings(), serialized.get(CBConstants.PARAM_PRODUCT_SETTINGS));
        Assertions.assertEquals(Map.of("core.localization.language", "en"), live.getProductSettings());
    }

    @Test
    public void doesNotRestoreResetPreferencesFromLiveConfiguration() {
        CBServerConfig live = new CBServerConfig();
        live.getProductSettings().put("core.localization.language", "zh");
        TestController controller = Mockito.mock(
            TestController.class,
            Mockito.CALLS_REAL_METHODS
        );
        Mockito.doReturn(live).when(controller).getServerConfiguration();

        Map<String, Object> serialized = controller.collectServerConfigProperties(
            new CBServerConfig(),
            Map.of(CBConstants.PARAM_PRODUCT_SETTINGS, live.getProductSettings())
        );

        Assertions.assertFalse(serialized.containsKey(CBConstants.PARAM_PRODUCT_SETTINGS));
        Assertions.assertEquals("zh", live.getProductSettings().get("core.localization.language"));
    }

    @Test
    public void removesResetPreferencesBeforeRuntimeReload() throws Exception {
        CBServerConfig live = new CBServerConfig();
        live.getProductSettings().put("core.localization.language", "zh");
        live.getProductSettings().put("core.theming.theme", "dark");
        CBServerConfig submitted = new CBServerConfig();
        submitted.getProductSettings().put("core.theming.theme", "dark");
        TestController controller = Mockito.mock(TestController.class, Mockito.CALLS_REAL_METHODS);
        Mockito.doReturn(live).when(controller).getServerConfiguration();
        CBAppConfig appConfig = new CBAppConfig();
        Mockito.doNothing().when(controller).saveRuntimeConfig(submitted, appConfig, null);
        TestApplication application = Mockito.mock(TestApplication.class, Mockito.CALLS_REAL_METHODS);
        Mockito.doReturn(controller).when(application).getServerConfigurationController();
        Mockito.doReturn(true).when(application).isConfigurationMode();
        Mockito.doAnswer(invocation -> {
            Map<String, Object> serialized = controller.collectServerConfigProperties(submitted, Map.of());
            Map<String, Object> reloaded = ServletAppUtils.mergeConfigurations(
                Map.of(CBConstants.PARAM_PRODUCT_SETTINGS, live.getProductSettings()), serialized
            );
            Assertions.assertEquals(
                Map.of("core.theming.theme", "dark"), reloaded.get(CBConstants.PARAM_PRODUCT_SETTINGS)
            );
            return null;
        }).when(application).reloadConfiguration(null);

        application.finishConfiguration("admin", null, List.of(), submitted, appConfig, null);

        Mockito.verify(application).reloadConfiguration(null);
    }

    public abstract static class TestApplication extends CBApplication<CBServerConfig> {
    }

    public abstract static class TestController extends CBServerConfigurationController<CBServerConfig> {
        protected TestController(@NotNull CBServerConfig config, @NotNull Path home) {
            super(config, home);
        }

        @Override
        public synchronized void saveRuntimeConfig(
            @NotNull CBServerConfig config,
            @NotNull CBAppConfig appConfig,
            @Nullable SMCredentialsProvider credentialsProvider
        ) throws DBException {
            super.saveRuntimeConfig(config, appConfig, credentialsProvider);
        }

        @NotNull
        @Override
        public Map<String, Object> collectServerConfigProperties(
            @NotNull CBServerConfig config,
            @NotNull Map<String, Object> original
        ) {
            return super.collectServerConfigProperties(config, original);
        }
    }
}

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
package io.cloudbeaver.test.platform;

import graphql.GraphQLContext;
import graphql.schema.DataFetchingEnvironment;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.DBWebExceptionAccessDenied;
import io.cloudbeaver.DBWebExceptionServerNotInitialized;
import io.cloudbeaver.server.WebApplication;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.core.DBWServiceCore;
import org.jkiss.code.NotNull;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Map;

public class ConfigurationModeAccessTest {

    @Test
    public void configurationModeAccessIsDeniedByDefault() {
        DBWServiceCore service = createService(false);
        DBWebExceptionAccessDenied exception = Assertions.assertThrows(
            DBWebExceptionAccessDenied.class,
            () -> service.getUserConnections(null, null, null, null)
        );
        Assertions.assertEquals("Action is not available in server configuration mode", exception.getMessage());
        Assertions.assertThrows(
            DBWebExceptionAccessDenied.class,
            () -> service.createConnection(null, null, Map.of())
        );
    }

    @Test
    public void explicitlyAllowedActionIsAvailableInConfigurationMode() {
        DBWServiceCore service = createService(false);
        Assertions.assertDoesNotThrow(() -> service.getServerConfig(null));
    }

    @Test
    public void initializationCheckIsAppliedToConfigurationModeActions() {
        DBWServiceCore service = createService(true);
        Assertions.assertThrows(
            DBWebExceptionServerNotInitialized.class,
            () -> service.getDriverList(null, null)
        );
    }

    @NotNull
    private static DBWServiceCore createService(boolean initializationMode) {
        DataFetchingEnvironment environment = Mockito.mock(DataFetchingEnvironment.class);
        Mockito.when(environment.getGraphQlContext()).thenReturn(GraphQLContext.newContext().build());

        WebApplication application = Mockito.mock(WebApplication.class);
        Mockito.when(application.isConfigurationMode()).thenReturn(true);
        Mockito.when(application.isInitializationMode()).thenReturn(initializationMode);
        Mockito.when(application.getInitActions()).thenReturn(Map.of());

        return new TestBinding(Mockito.mock(DBWServiceCore.class), application).getServiceProxy(environment);
    }

    private static class TestBinding extends WebServiceBindingBase<DBWServiceCore> {
        private final WebApplication application;

        private TestBinding(@NotNull DBWServiceCore service, @NotNull WebApplication application) {
            super(DBWServiceCore.class, service, null);
            this.application = application;
        }

        @NotNull
        @Override
        protected WebApplication getApplication() {
            return application;
        }

        @NotNull
        private DBWServiceCore getServiceProxy(@NotNull DataFetchingEnvironment environment) {
            return getService(environment);
        }

        @Override
        public void bindWiring(@NotNull DBWBindingContext model) throws DBWebException {
        }
    }
}

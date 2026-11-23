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
import org.eclipse.core.runtime.IAdaptable;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.access.DBAUserPasswordManager;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Arrays;

public class WebConnectionInfoTest {
    @Test
    public void passwordChangeFeatureFollowsConnectedDataSourceSupport() {
        DBPDataSourceContainer container = Mockito.mock(DBPDataSourceContainer.class);
        WebConnectionInfo connection = new WebConnectionInfo(Mockito.mock(WebSession.class), container);
        Mockito.when(container.isConnected()).thenReturn(true);

        Assertions.assertFalse(Arrays.asList(connection.getFeatures()).contains("userPasswordChange"));

        Mockito.when(container.getDataSource()).thenReturn(Mockito.mock(DBPDataSource.class));
        Assertions.assertFalse(Arrays.asList(connection.getFeatures()).contains("userPasswordChange"));

        AdaptableDataSource dataSource = Mockito.mock(AdaptableDataSource.class);
        Mockito.when(container.getDataSource()).thenReturn(dataSource);
        Assertions.assertFalse(Arrays.asList(connection.getFeatures()).contains("userPasswordChange"));

        Mockito.when(dataSource.getAdapter(DBAUserPasswordManager.class))
            .thenReturn(Mockito.mock(DBAUserPasswordManager.class));
        Assertions.assertTrue(Arrays.asList(connection.getFeatures()).contains("userPasswordChange"));

        Mockito.when(container.isConnected()).thenReturn(false);
        Assertions.assertFalse(Arrays.asList(connection.getFeatures()).contains("userPasswordChange"));
    }

    public interface AdaptableDataSource extends DBPDataSource, IAdaptable {
    }
}

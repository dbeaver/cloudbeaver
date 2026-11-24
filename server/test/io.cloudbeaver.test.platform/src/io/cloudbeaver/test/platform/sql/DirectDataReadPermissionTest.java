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
package io.cloudbeaver.test.platform.sql;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLDataFilter;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Set;

public class DirectDataReadPermissionTest {
    private final WebSession session = Mockito.mock(WebSession.class);

    @Test
    public void rejectsDirectReadBeforeOpeningDatabaseContext() throws Exception {
        var processor = Mockito.mock(WebSQLProcessor.class);
        var context = Mockito.mock(WebSQLContextInfo.class);
        var monitor = Mockito.mock(DBRProgressMonitor.class);
        var container = Mockito.mock(DBSDataContainer.class);
        var filter = new WebSQLDataFilter();
        Mockito.when(processor.getWebSession()).thenReturn(session);
        Mockito.doCallRealMethod().when(processor).readDataFromContainer(context, monitor, container, null, filter, null);

        Assertions.assertThrows(
            DBWebException.class,
            () -> processor.readDataFromContainer(context, monitor, container, null, filter, null)
        );
        Mockito.verify(session).hasPermission(DBWConstants.PERMISSION_READ_DATA_FROM_CONNECTION);
        Mockito.verifyNoInteractions(container);
    }

    @Test
    public void sessionRequiresDirectReadPermissionOrAdmin() {
        Mockito.when(session.hasPermission(DBWConstants.PERMISSION_READ_DATA_FROM_CONNECTION)).thenCallRealMethod();
        Mockito.when(session.getSessionPermissions())
            .thenReturn(Set.of())
            .thenReturn(Set.of(DBWConstants.PERMISSION_READ_DATA_FROM_CONNECTION))
            .thenReturn(Set.of(DBWConstants.PERMISSION_ADMIN));

        Assertions.assertFalse(session.hasPermission(DBWConstants.PERMISSION_READ_DATA_FROM_CONNECTION));
        Assertions.assertTrue(session.hasPermission(DBWConstants.PERMISSION_READ_DATA_FROM_CONNECTION));
        Assertions.assertTrue(session.hasPermission(DBWConstants.PERMISSION_READ_DATA_FROM_CONNECTION));
    }
}

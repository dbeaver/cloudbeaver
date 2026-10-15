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
package io.cloudbeaver;

import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.access.DBAPasswordChangeInfo;
import org.jkiss.dbeaver.model.access.DBAuthUtils;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

class DBAuthUtilsTest {
    @Test
    void resolvesCredentialsUsedByActiveConnectionFirst() {
        DBPConnectionConfiguration saved = new DBPConnectionConfiguration();
        saved.setUserName("saved-user");
        saved.setUserPassword("saved-password");
        DBPConnectionConfiguration actual = new DBPConnectionConfiguration(saved);
        actual.setUserName("actual-user");
        actual.setUserPassword("actual-password");
        DBPDataSourceContainer container = Mockito.mock(DBPDataSourceContainer.class);
        Mockito.when(container.getConnectionConfiguration()).thenReturn(saved);
        Mockito.when(container.getActualConnectionConfiguration()).thenReturn(actual);

        assertEquals("actual-user", DBAuthUtils.getCurrentUserName(container));
        assertEquals("actual-password", DBAuthUtils.getCurrentUserPassword(container));
    }

    @Test
    void sharesPendingPasswordChangeWithActualConfiguration() {
        DBPConnectionConfiguration saved = new DBPConnectionConfiguration();
        DBPConnectionConfiguration actual = new DBPConnectionConfiguration(saved);
        DBAPasswordChangeInfo passwordChangeInfo = new DBAPasswordChangeInfo("user", "old-password");
        passwordChangeInfo.setNewPassword("new-password");

        DBAuthUtils.setPendingPasswordChange(saved, passwordChangeInfo);

        assertSame(passwordChangeInfo, DBAuthUtils.getPendingPasswordChange(actual));
        DBAuthUtils.clearPendingPasswordChange(actual);
        assertNull(DBAuthUtils.getPendingPasswordChange(saved));
    }

    @Test
    void canCopyConfigurationWithoutSharingRuntimeAttributes() {
        DBPConnectionConfiguration saved = new DBPConnectionConfiguration();
        DBPConnectionConfiguration copy = DBPConnectionConfiguration.copyWithIndependentRuntimeAttributes(saved);
        DBAPasswordChangeInfo passwordChangeInfo = new DBAPasswordChangeInfo("user", "old-password");

        DBAuthUtils.setPendingPasswordChange(copy, passwordChangeInfo);

        assertSame(passwordChangeInfo, DBAuthUtils.getPendingPasswordChange(copy));
        assertNull(DBAuthUtils.getPendingPasswordChange(saved));
    }
}

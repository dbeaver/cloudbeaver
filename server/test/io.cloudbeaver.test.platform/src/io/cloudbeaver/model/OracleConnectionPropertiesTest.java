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
import org.jkiss.dbeaver.ext.oracle.OracleDataSourceProvider;
import org.jkiss.dbeaver.ext.oracle.model.OracleConstants;
import org.jkiss.dbeaver.ext.oracle.model.auth.OracleAuthModelDatabaseNative;
import org.jkiss.dbeaver.ext.oracle.model.dict.OracleConnectionType;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Map;

class OracleConnectionPropertiesTest {

    @Test
    void readsExistingConnectionsInBothInterfacesWithoutResaving() {
        DBPConnectionConfiguration configuration = new DBPConnectionConfiguration();
        configuration.setAuthProperty(OracleConstants.PROP_AUTH_LOGON_AS, "sysdba");
        configuration.setProviderProperty(OracleConstants.PROP_SID_SERVICE, OracleConnectionType.SID.name());
        DBPDriver driver = Mockito.mock(DBPDriver.class);
        Mockito.doReturn(new OracleDataSourceProvider()).when(driver).getDataSourceProvider();
        DBPDataSourceContainer container = Mockito.mock(DBPDataSourceContainer.class);
        Mockito.when(container.getDriver()).thenReturn(driver);
        Mockito.when(container.getConnectionConfiguration()).thenReturn(configuration);
        WebConnectionInfo connection = new WebConnectionInfo(Mockito.mock(WebSession.class), container);

        Map<String, String> properties = connection.getProviderProperties();

        Assertions.assertEquals("SYSDBA", properties.get(OracleConstants.PROP_AUTH_LOGON_AS));
        Assertions.assertEquals(OracleConnectionType.SID.name(), properties.get(OracleConstants.PROP_SID_SERVICE));
        Assertions.assertEquals(Map.of(OracleConstants.PROP_SID_SERVICE, "SID"), configuration.getProviderProperties());
        Assertions.assertEquals("sysdba", configuration.getAuthProperty(OracleConstants.PROP_AUTH_LOGON_AS));

        configuration.setAuthProperties(null);
        configuration.setProviderProperty(OracleConstants.PROP_AUTH_LOGON_AS, "SYSOPER");
        Assertions.assertEquals("SYSOPER", OracleAuthModelDatabaseNative.getConnectionRole(configuration));
        Assertions.assertEquals("SYSOPER", connection.getProviderProperties().get(OracleConstants.PROP_AUTH_LOGON_AS));
    }
}

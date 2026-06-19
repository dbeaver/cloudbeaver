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

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.WebSessionGlobalProjectImpl;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.test.WebGQLClient;
import io.cloudbeaver.test.platform.util.GraphQLTestClientWrapper;
import io.cloudbeaver.test.platform.util.WebDBTestUtils;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCSession;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.junit.jupiter.api.BeforeEach;

public abstract class CloudbeaverDBTest extends CloudbeaverMockTest {

    protected final WebGQLClient client = CEAppStarter.createClient();
    protected DBPDataSourceContainer databaseContainer;
    protected static JDBCSession databaseSession;
    protected final DBRProgressMonitor monitor = new LoggingProgressMonitor();

    protected final GraphQLTestClientWrapper clientWrapper = new GraphQLTestClientWrapper(client);
    protected WebSessionGlobalProjectImpl globalProject;
    protected WebConnectionInfo webConnectionInfo;
    protected WebSession webSession;

    @BeforeEach
    public void init() throws Exception {
        String sessionId = clientWrapper.openSession();
        webSession = resolveWebSession(sessionId);
        globalProject = webSession.getGlobalProject();
        if (globalProject == null) {
            throw new DBException("Global project is not configured");
        }
        databaseContainer = WebDBTestUtils.createH2DataSource(monitor, globalProject);
        globalProject.getDataSourceRegistry().addDataSource(databaseContainer);
        databaseSession = DBUtils.openUtilSession(monitor, databaseContainer, "Internal database session");
        databaseSession.enableLogging(false);
        webConnectionInfo = globalProject.addConnection(databaseContainer);
    }

    private static WebSession resolveWebSession(String sessionId) throws DBException {
        var sessionManager = WebAppUtils.getWebApplication().getSessionManager();
        BaseWebSession session = sessionId == null ? null : sessionManager.getSession(sessionId);
        if (session instanceof WebSession ws) {
            return ws;
        }
        return (WebSession) sessionManager.getAllActiveSessions().stream()
            .findFirst()
            .orElseThrow(() -> new DBException("No active web session"));
    }

}

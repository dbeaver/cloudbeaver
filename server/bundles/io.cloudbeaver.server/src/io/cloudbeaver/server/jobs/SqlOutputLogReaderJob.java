/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
package io.cloudbeaver.server.jobs;

import io.cloudbeaver.model.session.WebSession;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.exec.DBCStatement;
import org.jkiss.dbeaver.model.exec.output.DBCOutputSeverity;
import org.jkiss.dbeaver.model.exec.output.DBCOutputWriter;
import org.jkiss.dbeaver.model.exec.output.DBCServerOutputReader;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.websocket.event.WSOutputLogInfo;
import org.jkiss.dbeaver.model.websocket.event.session.WSDBOutputLogEvent;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import java.util.ArrayList;
import java.util.List;


public class SqlOutputLogReaderJob extends AbstractJob {

    private static final Log log = Log.getLog(SqlOutputLogReaderJob.class);

    @NotNull
    private final WebSession webSession;
    @NotNull
    private final DBCExecutionContext dbcExecutionContext;
    @NotNull
    private final DBCStatement dbcStatement;
    @NotNull
    private final DBCServerOutputReader dbcServerOutputReader;

    public SqlOutputLogReaderJob(@NotNull WebSession webSession,
                                 @NotNull DBCExecutionContext dbcExecutionContext,
                                 @NotNull DBCStatement dbcStatement,
                                 @NotNull DBCServerOutputReader dbcServerOutputReader) {
        super("Sql log state job");
        this.webSession = webSession;
        this.dbcExecutionContext = dbcExecutionContext;
        this.dbcStatement = dbcStatement;
        this.dbcServerOutputReader = dbcServerOutputReader;
    }

    @Override
    protected IStatus run(DBRProgressMonitor monitor) {
        if (!DBWorkbench.getPlatform().isShuttingDown()) {
            try {
                if (!dbcStatement.isStatementClosed()) {
                    dumpOutput(monitor);
                    schedule(100);
                }
            } catch (Exception e) {
                log.debug("Failed to execute job " + e.getMessage(), e);
            }
        }
        return Status.OK_STATUS;
    }

    private void dumpOutput(DBRProgressMonitor monitor) {
        if (!monitor.isCanceled()) {
            if (dbcServerOutputReader.isAsyncOutputReadSupported()) {
                try {
                    if (!dbcStatement.isStatementClosed()) {
                        List<WSOutputLogInfo> messages = new ArrayList<>();
                        dbcServerOutputReader.readServerOutput(monitor, dbcExecutionContext, null, dbcStatement, new DBCOutputWriter() {
                            @Override
                            public void println(@Nullable DBCOutputSeverity severity, @Nullable String message) {
                                if (severity != null) {
                                    messages.add(new WSOutputLogInfo(severity.getName(), message));
                                } else {
                                    messages.add(new WSOutputLogInfo("UNKNOWN", message));
                                }
                            }

                            @Override
                            public void flush() {
                                messages.clear();
                            }
                        });
                        webSession.addSessionEvent(new WSDBOutputLogEvent(
                            String.valueOf(dbcExecutionContext.getContextId()),
                            messages,
                            System.currentTimeMillis()));
                    }
                } catch (DBCException e) {
                    log.error(e);
                }
            }
        }
    }
}
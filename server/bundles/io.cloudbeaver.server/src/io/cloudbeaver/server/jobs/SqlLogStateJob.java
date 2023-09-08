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
import org.jkiss.dbeaver.model.websocket.event.session.WSLogSenderEvent;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import java.util.ArrayList;
import java.util.List;


public class SqlLogStateJob extends AbstractJob {

    private static final Log log = Log.getLog(SqlLogStateJob.class);

    private final WebSession webSession;
    private final DBCExecutionContext dbcExecutionContext;
    private final DBCStatement dbcStatement;
    private final DBCServerOutputReader dbcServerOutputReader;

    public SqlLogStateJob(WebSession webSession, DBCExecutionContext dbcExecutionContext, DBCStatement dbcStatement,
                          DBCServerOutputReader dbcServerOutputReader) {
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
                }
            } catch (Exception e) {
                log.debug(e);
            }
            schedule(100);
        }

        return Status.OK_STATUS;
    }

    private void dumpOutput(DBRProgressMonitor monitor) {
        if (!monitor.isCanceled()) {
            DBCServerOutputReader outputReader = dbcServerOutputReader;
            final DBCExecutionContext executionContext = dbcExecutionContext;

            if (outputReader != null && outputReader.isAsyncOutputReadSupported() && executionContext != null) {
                try {
                    if (dbcStatement != null && !dbcStatement.isStatementClosed()) {
                        List<String> messages = new ArrayList<>();
                        outputReader.readServerOutput(monitor, executionContext, null, dbcStatement, new DBCOutputWriter() {
                            @Override
                            public void println(@Nullable DBCOutputSeverity severity, @Nullable String message) {
                                messages.add(message);
                            }

                            @Override
                            public void flush() {
                                messages.clear();
                            }
                        });
                        webSession.addSessionEvent(new WSLogSenderEvent(
                            String.valueOf(executionContext.getContextId()),
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
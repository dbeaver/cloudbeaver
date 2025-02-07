/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.service.sql;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebTransactionLogInfo;
import io.cloudbeaver.model.WebTransactionLogItemInfo;
import io.cloudbeaver.model.session.WebAsyncTaskProcessor;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionProvider;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.exec.*;
import org.jkiss.dbeaver.model.exec.trace.DBCTrace;
import org.jkiss.dbeaver.model.messages.ModelMessages;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.qm.QMTransactionState;
import org.jkiss.dbeaver.model.qm.QMUtils;
import org.jkiss.dbeaver.model.qm.meta.QMMConnectionInfo;
import org.jkiss.dbeaver.model.qm.meta.QMMStatementExecuteInfo;
import org.jkiss.dbeaver.model.qm.meta.QMMTransactionInfo;
import org.jkiss.dbeaver.model.qm.meta.QMMTransactionSavepointInfo;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.struct.rdb.DBSCatalog;
import org.jkiss.dbeaver.model.struct.rdb.DBSSchema;
import org.jkiss.dbeaver.model.websocket.event.WSTransactionalCountEvent;
import org.jkiss.dbeaver.utils.RuntimeUtils;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * WebSQLContextInfo.
 */
public class WebSQLContextInfo implements WebSessionProvider {

    private static final Log log = Log.getLog(WebSQLContextInfo.class);

    private final transient WebSQLProcessor processor;
    private final String id;
    private final String projectId;
    private final Map<String, WebSQLResultsInfo> resultInfoMap = new HashMap<>();

    private final AtomicInteger resultId = new AtomicInteger();

    public static final DateTimeFormatter ISO_DATE_FORMAT = DateTimeFormatter.ofPattern(DBConstants.DEFAULT_ISO_TIMESTAMP_FORMAT)
        .withZone(ZoneId.of("UTC"));

    public WebSQLContextInfo(
        WebSQLProcessor processor, String id, String catalogName, String schemaName, String projectId
    ) throws DBCException {
        this.processor = processor;
        this.id = id;

        WebProjectImpl project = processor.getWebSession().getProjectById(projectId);
        if (project == null) {
            throw new DBCException("Project '" + projectId + "' doesn't exist in the session");
        }

        this.projectId = project.getId();

        if (!CommonUtils.isEmpty(catalogName) || !CommonUtils.isEmpty(schemaName)) {
            try {
                DBExecUtils.setExecutionContextDefaults(
                    processor.getWebSession().getProgressMonitor(),
                    processor.getConnection().getDataSource(),
                    processor.getExecutionContext(),
                    catalogName,
                    null,
                    schemaName);
            } catch (DBException e) {
                log.error("Error settings ");
            }
        }
    }

    public WebSQLProcessor getProcessor() {
        return processor;
    }

    public String getId() {
        return id;
    }

    public String getProjectId() {
        return projectId;
    }

    public String getConnectionId() {
        return processor.getConnection().getId();
    }

    public String getDefaultCatalog() {
        DBCExecutionContextDefaults contextDefaults = processor.getExecutionContext().getContextDefaults();

        if(contextDefaults != null) {
            DBSCatalog catalog = contextDefaults.getDefaultCatalog();

            return catalog == null ? null : catalog.getName();
        }

        return null;
    }

    @WebAction
    public String getDefaultSchema() {
        DBCExecutionContextDefaults contextDefaults = processor.getExecutionContext().getContextDefaults();

        if(contextDefaults != null) {
            DBSSchema schema = contextDefaults.getDefaultSchema();

            return schema == null ? null : schema.getName();
        }

        return null;
    }

    public void setDefaults(String catalogName, String schemaName) throws DBWebException, DBCException {
        String oldCatalogName = this.getDefaultCatalog();
        try {
            DBExecUtils.setExecutionContextDefaults(
                processor.getWebSession().getProgressMonitor(),
                processor.getConnection().getDataSource(),
                processor.getExecutionContext(),
                catalogName,
                oldCatalogName,
                schemaName);
        } catch (DBException e) {
            throw new DBWebException("Error ", e);
        }
    }

    /**
     * Saves results info into cache.
     * Helps to find it with results id sent by front-end.
     */
    @NotNull
    public WebSQLResultsInfo saveResult(
        @NotNull DBSDataContainer dataContainer,
        @NotNull DBCTrace trace,
        @NotNull DBDAttributeBinding[] attributes,
        boolean singleRow) {
        WebSQLResultsInfo resultInfo = new WebSQLResultsInfo(
            dataContainer,
            String.valueOf(resultId.incrementAndGet())
        );
        resultInfo.setAttributes(attributes);
        resultInfo.setSingleRow(singleRow);
        resultInfo.setTrace(trace);
        resultInfoMap.put(resultInfo.getId(), resultInfo);
        return resultInfo;
    }

    @NotNull
    public WebSQLResultsInfo getResults(@NotNull String resultId) throws DBWebException {
        WebSQLResultsInfo resultsInfo = resultInfoMap.get(resultId);
        if (resultsInfo == null) {
            throw new DBWebException("Results '" + resultId + "' not found in context '" + getId() + "'@'" + processor.getConnection().getId() + "'");
        }
        return resultsInfo;
    }

    public boolean closeResult(@NotNull String resultId) {
        return resultInfoMap.remove(resultId) != null;
    }

    ///////////////////////////////////////////////////////
    // Async model

    void dispose() {
        resultInfoMap.clear();
    }

    @Override
    public WebSession getWebSession() {
        return processor.getWebSession();
    }


    ///////////////////////////////////////////////////////
    // Transactions

    public WebAsyncTaskInfo setAutoCommit(boolean autoCommit) {
        DBCExecutionContext context = processor.getExecutionContext();
        DBCTransactionManager txnManager = DBUtils.getTransactionManager(context);
        WebAsyncTaskProcessor<Boolean> runnable = new WebAsyncTaskProcessor<>() {
            @Override
            public void run(DBRProgressMonitor monitor) throws InvocationTargetException, InterruptedException {
                if (txnManager != null) {
                    monitor.beginTask("Change connection auto-commit to " + autoCommit, 1);
                    try {
                        monitor.subTask("Change context '" + context.getContextName() + "' auto-commit state");
                        txnManager.setAutoCommit(monitor, autoCommit);
                        result = true;
                    } catch (DBException e) {
                        throw new InvocationTargetException(e);
                    } finally {
                        monitor.done();
                    }
                }

            }
        };
        return getWebSession().createAndRunAsyncTask("Set auto-commit", runnable);

    }

    public WebTransactionLogInfo getTransactionLogInfo() {
        DBCExecutionContext context = processor.getExecutionContext();
        return getTransactionLogInfo(context);
    }

    @NotNull
    private WebTransactionLogInfo getTransactionLogInfo(DBCExecutionContext executionContext) {
        int updateCount = 0;
        List<WebTransactionLogItemInfo> logItemInfos = new ArrayList<>();
        QMMConnectionInfo sessionInfo = QMUtils.getCurrentConnection(executionContext);
        if (sessionInfo.isTransactional()) {
            QMMTransactionInfo txnInfo = sessionInfo.getTransaction();
            if (txnInfo != null) {
                QMMTransactionSavepointInfo sp = txnInfo.getCurrentSavepoint();
                QMMStatementExecuteInfo execInfo = sp.getLastExecute();
                for (QMMStatementExecuteInfo exec = execInfo; exec != null && exec.getSavepoint() == sp; exec = exec.getPrevious()) {
                    if (exec.getUpdateRowCount() > 0 ) {
                        DBCExecutionPurpose purpose = exec.getStatement().getPurpose();
                        if (!exec.hasError() && purpose != DBCExecutionPurpose.META && purpose != DBCExecutionPurpose.UTIL) {
                            updateCount++;
                        }
                        generateLogInfo(logItemInfos, exec, purpose, updateCount);
                    }
                }
            }
        } else {
            QMMStatementExecuteInfo execInfo = sessionInfo.getExecutionStack();
            for (QMMStatementExecuteInfo exec = execInfo; exec != null; exec = exec.getPrevious()) {
                if (exec.getUpdateRowCount() > 0) {
                    updateCount++;
                    DBCExecutionPurpose purpose = exec.getStatement().getPurpose();
                    generateLogInfo(logItemInfos, exec, purpose, updateCount);
                }
            }
        }
        return new WebTransactionLogInfo(logItemInfos, updateCount);
    }

    private void generateLogInfo(
        @NotNull List<WebTransactionLogItemInfo> logItemInfos,
        @NotNull QMMStatementExecuteInfo exec,
        @NotNull DBCExecutionPurpose purpose,
        int id
    ) {
        String type = "SQL / " + purpose.getTitle();
        String dateTime = ISO_DATE_FORMAT.format(Instant.ofEpochMilli(exec.getCloseTime()));
        String result = ModelMessages.controls_querylog_success;
        if (exec.hasError()) {
            if (exec.getErrorCode() == 0) {
                result = exec.getErrorMessage();
            } else if (exec.getErrorMessage() == null) {
                result = ModelMessages.controls_querylog_error + exec.getErrorCode() + "]"; //$NON-NLS-1$
            } else {
                result = "[" + exec.getErrorCode() + "] " + exec.getErrorMessage(); //$NON-NLS-1$ //$NON-NLS-2$
            }
        }

        logItemInfos.add(
            new WebTransactionLogItemInfo(id, dateTime, type, exec.getQueryString(),
                exec.getDuration(), exec.getUpdateRowCount(), result)
        );
    }


    public WebAsyncTaskInfo commitTransaction() {
        DBCExecutionContext context = processor.getExecutionContext();
        DBCTransactionManager txnManager = DBUtils.getTransactionManager(context);
        WebAsyncTaskProcessor<String> runnable = new WebAsyncTaskProcessor<>() {
            @Override
            public void run(DBRProgressMonitor monitor) throws InvocationTargetException, InterruptedException {
                if (txnManager != null) {
                    QMTransactionState txnInfo = QMUtils.getTransactionState(context);
                    try (DBCSession session = context.openSession(monitor, DBCExecutionPurpose.UTIL, "Commit transaction")) {
                        txnManager.commit(session);
                    } catch (DBCException e) {
                        throw new InvocationTargetException(e);
                    }
                    result = """
                    Transaction has been committed
                    Query count: %s
                    Duration: %s
                    """.formatted(
                        txnInfo.getUpdateCount(),
                        RuntimeUtils.formatExecutionTime(System.currentTimeMillis() - txnInfo.getTransactionStartTime())
                    );
                }
                processor.getWebSession().addSessionEvent(
                    new WSTransactionalCountEvent(
                        processor.getWebSession().getSessionId(),
                        processor.getWebSession().getUserId(),
                        getProjectId(),
                        getId(),
                        getConnectionId(),
                        0
                    )
                );

            }
        };
        return getWebSession().createAndRunAsyncTask("Commit transaction", runnable);
    }


    public WebAsyncTaskInfo rollbackTransaction() {
        DBCExecutionContext context = processor.getExecutionContext();
        DBCTransactionManager txnManager = DBUtils.getTransactionManager(context);
        WebAsyncTaskProcessor<String> runnable = new WebAsyncTaskProcessor<>() {
            @Override
            public void run(DBRProgressMonitor monitor) throws InvocationTargetException, InterruptedException {
                if (txnManager != null) {
                    QMTransactionState txnInfo = QMUtils.getTransactionState(context);
                    try (DBCSession session = context.openSession(monitor, DBCExecutionPurpose.UTIL, "Rollback transaction")) {
                        txnManager.rollback(session, null);
                    } catch (DBCException e) {
                        throw new InvocationTargetException(e);
                    }
                    result = """
                    Transaction has been rolled back
                    Query count: %s
                    Duration: %s
                    """.formatted(
                        txnInfo.getUpdateCount(),
                        RuntimeUtils.formatExecutionTime(System.currentTimeMillis() - txnInfo.getTransactionStartTime())
                    );
                    processor.getWebSession().addSessionEvent(
                        new WSTransactionalCountEvent(
                            processor.getWebSession().getSessionId(),
                            processor.getWebSession().getUserId(),
                            getProjectId(),
                            getId(),
                            getConnectionId(),
                            0
                        )
                    );
                }
            }
        };

        return getWebSession().createAndRunAsyncTask("Rollback transaction", runnable);
    }

    @Property
    public Boolean isAutoCommit() throws DBWebException {
        DBCExecutionContext context = processor.getExecutionContext();
        DBCTransactionManager txnManager = DBUtils.getTransactionManager(context);
        if (txnManager == null || !txnManager.isSupportsTransactions()) {
            return null;
        }
        try {
            return txnManager.isAutoCommit();
        } catch (DBException e) {
            throw new DBWebException("Error getting auto-commit parameter from context", e);
        }
    }
}

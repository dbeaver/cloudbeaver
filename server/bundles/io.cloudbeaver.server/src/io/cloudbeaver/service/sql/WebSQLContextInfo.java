/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionProvider;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.exec.DBCExecutionContextDefaults;
import org.jkiss.dbeaver.model.exec.DBExecUtils;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.struct.rdb.DBSCatalog;
import org.jkiss.dbeaver.model.struct.rdb.DBSSchema;
import org.jkiss.utils.CommonUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * WebSQLContextInfo.
 */
public class WebSQLContextInfo implements WebSessionProvider {

    private static final Log log = Log.getLog(WebSQLContextInfo.class);

    private final WebSQLProcessor processor;
    private final String id;
    private final Map<String, WebSQLResultsInfo> resultInfoMap = new HashMap<>();

    private final AtomicInteger resultId = new AtomicInteger();

    public WebSQLContextInfo(WebSQLProcessor processor, String id, String catalogName, String schemaName) throws DBCException {
        this.processor = processor;
        this.id = id;

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

    @NotNull
    public WebSQLResultsInfo saveResult(@NotNull DBSDataContainer dataContainer, @NotNull DBDAttributeBinding[] attributes) {
        WebSQLResultsInfo resultInfo = new WebSQLResultsInfo(
            dataContainer,
            String.valueOf(resultId.incrementAndGet())
        );
        resultInfo.setAttributes(attributes);
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
}

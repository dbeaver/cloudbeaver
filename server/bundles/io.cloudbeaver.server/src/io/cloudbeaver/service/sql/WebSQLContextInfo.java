/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.exec.DBExecUtils;
import org.jkiss.dbeaver.model.impl.struct.ContextDefaultObjectsReader;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.DBSObjectContainer;
import org.jkiss.dbeaver.model.struct.rdb.DBSCatalog;
import org.jkiss.dbeaver.model.struct.rdb.DBSSchema;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * WebSQLContextInfo.
 */
public class WebSQLContextInfo {

    private static final Log log = Log.getLog(WebSQLContextInfo.class);

    private WebSQLProcessor processor;
    private String id;
    private DBSCatalog defaultCatalog;
    private String defaultSchema;
    private Map<String, WebSQLResultsInfo> resultInfoMap = new HashMap<>();

    private AtomicInteger resultId = new AtomicInteger();

    public WebSQLContextInfo(WebSQLProcessor processor, String id, String catalogName, String schemaName) {
        this.processor = processor;
        this.id = id;

        setContextDefaults(catalogName, schemaName);
    }

    private void setContextDefaults(String catalogName, String schemaName) {
        DBPDataSource dataSource = this.processor.getConnection().getDataSource();

        DBSObject defaultObject = null;
        if (CommonUtils.isEmpty(catalogName) && CommonUtils.isEmpty(schemaName)) {
            ContextDefaultObjectsReader defaultObjectsReader = new ContextDefaultObjectsReader(
                dataSource,
                DBUtils.getOrOpenDefaultContext(dataSource, false)
            );
            defaultObjectsReader.setReadNodes(false);
            try {
                defaultObjectsReader.run(this.processor.getWebSession().getProgressMonitor());
            } catch (InvocationTargetException e) {
                log.error("Error reading context defaults", e.getTargetException());
            } catch (InterruptedException e) {
                // ignore
            }

            catalogName = defaultObjectsReader.getDefaultCatalogName();
            defaultObject = defaultObjectsReader.getDefaultObject();
        }

        if (defaultObject instanceof DBSCatalog) {
            this.defaultCatalog = (DBSCatalog) defaultObject;
        } else if (defaultObject instanceof DBSSchema) {
            this.defaultCatalog = DBUtils.getParentOfType(DBSCatalog.class, defaultObject);
            this.defaultSchema = defaultObject.getName();
        } else {
            if (defaultObject == null && (!CommonUtils.isEmpty(catalogName) || !CommonUtils.isEmpty(schemaName))) {
                String childObjectName = CommonUtils.toString(catalogName, schemaName);
                DBSObjectContainer objectContainer = DBUtils.getAdapter(DBSObjectContainer.class, dataSource);
                if (objectContainer != null) {
                    try {
                        DBSObject childObject = objectContainer.getChild(this.processor.getWebSession().getProgressMonitor(), childObjectName);
                        if (childObject == null) {
                            log.debug("Can't find child '" + childObjectName + "'");
                        } else if (childObject instanceof DBSCatalog) {
                            defaultCatalog = (DBSCatalog) childObject;
                        } else if (childObject instanceof DBSSchema) {
                            this.defaultCatalog = DBUtils.getParentOfType(DBSCatalog.class, childObject);
                            this.defaultSchema = childObject.getName();
                        }
                    } catch (DBException e) {
                        log.error("Error reading default object '" + childObjectName + "'", e);
                    }
                }
            }
        }

        if (defaultSchema == null && schemaName != null) {
            defaultSchema = schemaName;
        }
    }

    public WebSQLProcessor getProcessor() {
        return processor;
    }

    public String getId() {
        return id;
    }

    public String getDefaultCatalog() {
        return defaultCatalog == null ? null : defaultCatalog.getName();
    }

    public void setDefaults(String catalogName, String schemaName) throws DBWebException {
        String oldCatalogName = defaultCatalog == null ? null : defaultCatalog.getName();
        setContextDefaults(catalogName, schemaName);
        try {
            DBExecUtils.setExecutionContextDefaults(
                processor.getWebSession().getProgressMonitor(),
                processor.getConnection().getDataSource(),
                processor.getExecutionContext(),
                defaultCatalog == null ? null : defaultCatalog.getName(),
                oldCatalogName,
                schemaName);
        } catch (DBException e) {
            throw new DBWebException("Error ", e);
        }
    }

    @WebAction
    public String getDefaultSchema() {
        if (defaultSchema == null) {
            DBCExecutionContext defaultContext = DBUtils.getOrOpenDefaultContext(
                defaultCatalog != null ? defaultCatalog : processor.getConnection().getDataSource(), false);
            if (defaultContext == null) {
                return null;
            }
            DBSObject ao = DBUtils.getActiveInstanceObject(defaultContext);
            if (ao instanceof DBSSchema) {
                defaultSchema = ao.getName();
            } else {
                defaultSchema = "";
            }
        }
        return CommonUtils.isEmpty(defaultSchema) ? null : defaultSchema;
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

}

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
package io.cloudbeaver.service.sql.resultset;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import io.cloudbeaver.service.sql.WebSQLResultsRow;
import io.cloudbeaver.service.sql.WebSQLUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataKind;
import org.jkiss.dbeaver.model.data.*;
import org.jkiss.dbeaver.model.edit.DBEPersistAction;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.exec.DBCSession;
import org.jkiss.dbeaver.model.struct.DBSDocumentLocator;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

public class WebSQLDataUpdaterBuilder {
    private static final String FILE_ID = "fileId";
    private static final String TEMP_FILE_FOLDER = "temp-sql-upload-files";

    private final List<WebSQLDataStatementInfo> updateStatements = new ArrayList<>();
    private final List<WebSQLDataStatementInfo> insertStatements = new ArrayList<>();
    private final List<WebSQLDataStatementInfo> deleteStatements = new ArrayList<>();
    private final Set<DBDRowIdentifier> rowIdentifierList;
    private final WebSession webSession;
    private final WebSQLResultsInfo resultsInfo;
    private final DBCSession session;
    private boolean withoutExecution = false;
    private List<DBEPersistAction> actions;

    public WebSQLDataUpdaterBuilder(
        @NotNull WebSession webSession,
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull Set<DBDRowIdentifier> rowIdentifierList,
        @NotNull DBCSession session
    ) {
        this.rowIdentifierList = rowIdentifierList;
        this.webSession = webSession;
        this.resultsInfo = resultsInfo;
        this.session = session;
    }

    @NotNull
    public WebSQLDataUpdaterBuilder setWithoutExecution(boolean withoutExecution) {
        this.withoutExecution = withoutExecution;
        return this;
    }

    @NotNull
    public WebSQLDataUpdaterBuilder withActions(@NotNull List<DBEPersistAction> actions) {
        this.actions = actions;
        return this;
    }

    @NotNull
    public WebSQLDataUpdaterBuilder prepareUpdateStatements(@Nullable List<WebSQLResultsRow> updatedRows) throws DBException {
        if (CommonUtils.isEmpty(updatedRows)) {
            return this;
        }
        DBDAttributeBinding[] allAttributes = resultsInfo.getAttributes();

        for (DBDRowIdentifier rowIdentifier : rowIdentifierList) {
            DBDAttributeBinding[] keyAttributes = rowIdentifier.getAttributes().toArray(new DBDAttributeBinding[0]);
            for (WebSQLResultsRow row : updatedRows) {
                Object[] finalRow = row.getData();
                Map<String, Object> updateValues = row.getUpdateValues().entrySet().stream()
                    .filter(x -> CommonUtils.equalObjects(allAttributes[CommonUtils.toInt(x.getKey())].getRowIdentifier(), rowIdentifier))
                    .collect(HashMap::new, (m, v) -> m.put(v.getKey(), v.getValue()), HashMap::putAll);

                Map<String, Object> metaData;
                if (row.getMetaData() != null) {
                    metaData = new HashMap<>(row.getMetaData());
                } else {
                    metaData = new HashMap<>();
                }

                if (finalRow.length == 0 || CommonUtils.isEmpty(updateValues)) {
                    continue;
                }
                DBDAttributeBinding[] updateAttributes = new DBDAttributeBinding[updateValues.size()];
                // Final row is what we return back

                int index = 0;
                for (String indexStr : updateValues.keySet()) {
                    int attrIndex = CommonUtils.toInt(indexStr, -1);
                    updateAttributes[index++] = allAttributes[attrIndex];
                }

                Object[] rowValues = new Object[updateAttributes.length + keyAttributes.length];
                // put key values first in case of updating them
                DBDDocument document = null;
                WebSQLDataStatementInfo statement = new WebSQLDataStatementInfo(rowIdentifier.getEntity(), finalRow);
                for (int i = 0; i < keyAttributes.length; i++) {
                    DBDAttributeBinding keyAttribute = keyAttributes[i];
                    boolean isDocumentValue = resultsInfo.getDataContainer() instanceof DBSDocumentLocator &&
                        keyAttributes.length == 1 && keyAttribute.getDataKind() == DBPDataKind.DOCUMENT;
                    if (isDocumentValue) {
                        document = WebSQLUtils.makeDocumentInputValue(
                            session,
                            (DBSDocumentLocator) resultsInfo.getDataContainer(),
                            resultsInfo,
                            row,
                            metaData
                        );
                        rowValues[updateAttributes.length + i] = document;
                    } else {
                        rowValues[updateAttributes.length + i] = keyAttribute.getValueHandler().getValueFromObject(
                            session,
                            keyAttribute,
                            WebSQLUtils.convertInputCellValue(
                                session,
                                keyAttribute,
                                row.getData()[(keyAttribute.getOrdinalPosition())],
                                withoutExecution
                            ),
                            false,
                            true
                        );
                    }
                    finalRow[keyAttribute.getOrdinalPosition()] = rowValues[updateAttributes.length + i];
                    statement.getKeyAttributes().add(new DBDAttributeValue(keyAttribute, finalRow[keyAttribute.getOrdinalPosition()]));
                }
                for (int i = 0; i < updateAttributes.length; i++) {
                    DBDAttributeBinding updateAttribute = updateAttributes[i];
                    Object value = updateValues.get(String.valueOf(updateAttribute.getOrdinalPosition()));
                    Object realCellValue = setCellRowValue(value, webSession, session, updateAttribute, withoutExecution);
                    if (document instanceof DBDComposite compositeDoc) {
                        compositeDoc.setAttributeValue(updateAttribute, realCellValue);
                    }
                    rowValues[i] = realCellValue;
                    finalRow[updateAttribute.getOrdinalPosition()] = realCellValue;
                    statement.getUpdateAttributes()
                        .add(new DBDAttributeValue(updateAttribute, finalRow[updateAttribute.getOrdinalPosition()]));
                }
                updateStatements.add(statement);
            }
        }
        return this;
    }

    @NotNull
    public WebSQLDataUpdaterBuilder prepareInsertStatements(@Nullable List<WebSQLResultsRow> addedRows) throws DBException {
        if (CommonUtils.isEmpty(addedRows)) {
            return this;
        }
        DBDAttributeBinding[] allAttributes = resultsInfo.getAttributes();

        for (DBDRowIdentifier rowIdentifier : rowIdentifierList) {
            for (WebSQLResultsRow row : addedRows) {
                Object[] addedValues = row.getData();
                if (addedValues.length == 0) {
                    continue;
                }
                Map<DBDAttributeBinding, Object> insertAttributes = new LinkedHashMap<>();
                // Final row is what we return back

                for (int i = 0; i < allAttributes.length; i++) {
                    if (addedValues[i] != null) {
                        Object realCellValue;
                        if (addedValues[i] instanceof Map<?, ?> variables) {
                            realCellValue = setCellRowValue(variables, webSession, session, allAttributes[i], withoutExecution);
                        } else {
                            realCellValue = WebSQLUtils.convertInputCellValue(
                                session,
                                allAttributes[i],
                                addedValues[i],
                                withoutExecution
                            );
                        }
                        insertAttributes.put(allAttributes[i], realCellValue);
                        addedValues[i] = realCellValue;
                    }
                }

                WebSQLDataStatementInfo statement = new WebSQLDataStatementInfo(rowIdentifier.getEntity(), addedValues);
                for (Map.Entry<DBDAttributeBinding, Object> entry : insertAttributes.entrySet()) {
                    statement.getKeyAttributes().add(new DBDAttributeValue(entry.getKey(), entry.getValue()));
                }
                insertStatements.add(statement);
            }
        }
        return this;
    }

    @NotNull
    public WebSQLDataUpdaterBuilder prepareDeleteStatements(@Nullable List<WebSQLResultsRow> deletedRows) throws DBException {
        if (CommonUtils.isEmpty(deletedRows)) {
            return this;
        }
        DBDAttributeBinding[] allAttributes = resultsInfo.getAttributes();

        for (DBDRowIdentifier rowIdentifier : rowIdentifierList) {
            DBDAttributeBinding[] keyAttributes = rowIdentifier.getAttributes().toArray(new DBDAttributeBinding[0]);
            for (WebSQLResultsRow row : deletedRows) {
                Object[] keyData = row.getData();
                Map<String, Object> keyMetaData = row.getMetaData();
                if (keyData.length == 0) {
                    continue;
                }
                Map<DBDAttributeBinding, Object> delKeyAttributes = new LinkedHashMap<>();

                boolean isDocumentKey = keyAttributes.length == 1 && keyAttributes[0].getDataKind() == DBPDataKind.DOCUMENT;

                if (resultsInfo.getDataContainer() instanceof DBSDocumentLocator dataLocator) {
                    Map<String, Object> keyMap = new LinkedHashMap<>();
                    DBDAttributeBinding[] attributes = resultsInfo.getAttributes();
                    for (int j = 0; j < attributes.length; j++) {
                        DBDAttributeBinding attr = attributes[j];
                        Object plainValue = WebSQLUtils.makePlainCellValue(session, attr, row.getData()[j]);
                        keyMap.put(attr.getName(), plainValue);
                    }
                    DBDDocument document = dataLocator.findDocument(session, keyMap, keyMetaData);
                    delKeyAttributes.put(keyAttributes[0], document);

                } else {
                    for (int i = 0; i < allAttributes.length; i++) {
                        if (isDocumentKey || ArrayUtils.contains(keyAttributes, allAttributes[i])) {
                            Object realCellValue = WebSQLUtils.convertInputCellValue(
                                session, allAttributes[i],
                                keyData[i], withoutExecution
                            );
                            delKeyAttributes.put(allAttributes[i], realCellValue);
                        }
                    }
                }
                WebSQLDataStatementInfo statement = new WebSQLDataStatementInfo(rowIdentifier.getEntity(), new Object[0]);
                for (Map.Entry<DBDAttributeBinding, Object> keyAttribute : delKeyAttributes.entrySet()) {
                    statement.getKeyAttributes().add(
                        new DBDAttributeValue(
                            keyAttribute.getKey(),
                            keyAttribute.getValue()
                        ));
                }
                deleteStatements.add(statement);
            }
        }
        return this;
    }

    @Nullable
    private Object setCellRowValue(
        @NotNull Object cellRow,
        @NotNull WebSession webSession,
        @NotNull DBCSession dbcSession,
        @NotNull DBDAttributeBinding allAttributes,
        boolean withoutExecution
    ) throws DBException {
        if (cellRow instanceof Map<?, ?> variables) {
            if (variables.get(FILE_ID) != null) {
                Path path = WebAppUtils.getWebPlatform()
                    .getTempFolder(webSession.getProgressMonitor(), TEMP_FILE_FOLDER)
                    .resolve(webSession.getSessionId())
                    .resolve(variables.get(FILE_ID).toString());

                try {
                    var file = Files.newInputStream(path);
                    return WebSQLUtils.convertInputCellValue(dbcSession, allAttributes, file, withoutExecution);
                } catch (IOException | DBCException e) {
                    throw new DBException(e.getMessage());
                }
            }
        }
        return WebSQLUtils.convertInputCellValue(dbcSession, allAttributes, cellRow, withoutExecution);
    }

    @NotNull
    public WebSQLDataUpdater build(@NotNull DBCExecutionContext executionContext) {
        return new WebSQLDataUpdater(
            executionContext,
            actions == null ? Collections.emptyList() : actions,
            updateStatements,
            insertStatements,
            deleteStatements,
            List.of(resultsInfo.getAttributes()),
            withoutExecution
        );
    }
}

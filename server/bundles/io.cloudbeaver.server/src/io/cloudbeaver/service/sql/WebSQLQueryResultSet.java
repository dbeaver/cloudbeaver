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
package io.cloudbeaver.service.sql;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.sql.WebSQLResultSetRowIdentifier.WebSQLResultSetRowIdentifierState;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.exec.DBExecUtils;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.*;

import java.util.*;
import java.util.function.Function;

/**
 * Web SQL query resultset.
 */
public class WebSQLQueryResultSet {

    private static final Log log = Log.getLog(WebSQLQueryResultSet.class);

    private WebSQLQueryResultColumn[] columns;
    private List<WebSQLQueryResultReference> references = Collections.emptyList();
    private List<WebSQLQueryResultSetRow> rows = Collections.emptyList();
    private boolean hasMoreData;
    private WebSQLResultsInfo resultsInfo;
    private boolean singleEntity = true;
    private boolean hasRowIdentifier;
    private WebSQLResultSetRowIdentifierState rowIdentifierState;
    private WebSQLResultSetRowIdentifier rowIdentifier;

    private boolean hasChildrenCollection;
    private boolean isSupportsDataFilter;
    private boolean hasDynamicTrace;
    private boolean readOnly;
    private String readOnlyStatus;

    public WebSQLQueryResultSet() {
    }

    @Property
    public String getId() {
        return resultsInfo == null ? null : resultsInfo.getId();
    }

    @Property
    public WebSQLQueryResultColumn[] getColumns() {
        return columns;
    }

    public void setColumns(WebSQLQueryResultColumn[] columns) {
        this.columns = columns;
    }

    public void setColumns(@NotNull WebSession session, @NotNull DBDAttributeBinding[] bindings) {
        WebSQLQueryResultColumn[] cols = new WebSQLQueryResultColumn[bindings.length];
        for (int i = 0; i < bindings.length; i++) {
            cols[i] = new WebSQLQueryResultColumn(bindings[i]);
        }
        this.columns = cols;
        this.references = collectReferences(session, bindings);
    }

    @NotNull
    @Property
    public List<WebSQLQueryResultReference> getReferences() {
        return references;
    }

    @Property
    @Deprecated
    public Object[][] getRows() {
        return rows.stream().map(WebSQLQueryResultSetRow::getData).toArray(x -> new Object[x][1]);
    }

    @Property
    public List<WebSQLQueryResultSetRow> getRowsWithMetaData() {
        return rows;
    }

    public void setRows(List<WebSQLQueryResultSetRow> rows) {
        this.rows = rows;
    }

    @Property
    public boolean isHasMoreData() {
        return hasMoreData;
    }

    public void setHasMoreData(boolean hasMoreData) {
        this.hasMoreData = hasMoreData;
    }

    @Property
    public boolean isSingleEntity() {
        return singleEntity;
    }

    public void setSingleEntity(boolean singleEntity) {
        this.singleEntity = singleEntity;
    }

    public WebSQLResultsInfo getResultsInfo() {
        return resultsInfo;
    }

    public void setResultsInfo(WebSQLResultsInfo resultsInfo) {
        this.resultsInfo = resultsInfo;
    }

    @Property
    public boolean isHasRowIdentifier() {
        return hasRowIdentifier;
    }

    public void setHasRowIdentifier(boolean hasRowIdentifier) {
        this.hasRowIdentifier = hasRowIdentifier;
    }

    @Property
    @Nullable
    public WebSQLResultSetRowIdentifier getRowIdentifier() {
        return rowIdentifier;
    }

    public void setRowIdentifier(@NotNull WebSQLResultSetRowIdentifier rowIdentifier) {
        this.rowIdentifier = rowIdentifier;
    }

    @Property
    public WebSQLResultSetRowIdentifierState getRowIdentifierState() {
        return rowIdentifierState;
    }

    public void setRowIdentifierState(WebSQLResultSetRowIdentifierState rowIdentifierState) {
        this.rowIdentifierState = rowIdentifierState;
    }

    @Property
    public boolean isHasChildrenCollection() {
        return hasChildrenCollection;
    }

    public void setHasChildrenCollection(boolean hasSuCollection) {
        this.hasChildrenCollection = hasSuCollection;
    }

    @Property
    public boolean isSupportsDataFilter() {
        return isSupportsDataFilter;
    }

    public void setSupportsDataFilter(boolean supportsDataFilter) {
        isSupportsDataFilter = supportsDataFilter;
    }

    @Property
    public boolean isHasDynamicTrace() {
        return hasDynamicTrace;
    }

    public void setHasDynamicTrace(boolean hasDynamicTrace) {
        this.hasDynamicTrace = hasDynamicTrace;
    }

    @Property
    public boolean isReadOnly() {
        return readOnly;
    }

    @Property
    public String getReadOnlyStatus() {
        return readOnlyStatus;
    }

    /**
     * Sets info about read-only status of a result set.
     */
    public void setReadOnlyInfo(@Nullable DBCExecutionContext executionContext) {
        this.readOnly = DBExecUtils.isResultSetReadOnly(executionContext);
        this.readOnlyStatus = DBExecUtils.getResultSetReadOnlyStatus(
            executionContext == null ? null : executionContext.getDataSource().getContainer());
    }

    @NotNull
    public static List<WebSQLQueryResultReference> collectReferences(
        @NotNull WebSession session,
        @NotNull DBDAttributeBinding[] bindings
    ) {
        Map<DBSEntityAttribute, Integer> attrToIndex = new HashMap<>();
        LinkedHashSet<DBSEntity> entities = new LinkedHashSet<>();
        for (int i = 0; i < bindings.length; i++) {
            DBSEntityAttribute ea = bindings[i].getEntityAttribute();
            if (ea == null) {
                continue;
            }
            attrToIndex.putIfAbsent(ea, i);
            DBSEntity parent = ea.getParentObject();
            entities.add(parent);
        }

        Function<DBSEntityAttribute, DBDAttributeBinding> attrToBinding = attr -> {
            Integer idx = attrToIndex.get(attr);
            return idx == null ? null : bindings[idx];
        };

        List<WebSQLQueryResultReference> result = new ArrayList<>();
        DBRProgressMonitor monitor = session.getProgressMonitor();
        for (DBSEntity entity : entities) {
            try {
                for (DBSEntityAssociation fk : DBExecUtils.readAssociations(monitor, entity, attrToBinding)) {
                    List<Integer> columnIndex = collectOwnColumnIndex(monitor, fk, false, attrToIndex);
                    if (columnIndex != null) {
                        result.add(new WebSQLQueryResultReference(session, fk, false, columnIndex));
                    }
                }
                for (DBSEntityAssociation ref : DBExecUtils.readReferences(monitor, entity, attrToBinding)) {
                    List<Integer> columnIndex = collectOwnColumnIndex(monitor, ref, true, attrToIndex);
                    if (columnIndex != null) {
                        result.add(new WebSQLQueryResultReference(session, ref, true, columnIndex));
                    }
                }
            } catch (DBException e) {
                log.debug("Error collecting references for entity " + entity.getName(), e);
            }
        }
        return result;
    }

    @Nullable
    private static List<Integer> collectOwnColumnIndex(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBSEntityAssociation association,
        boolean reverse,
        @NotNull Map<DBSEntityAttribute, Integer> attrToIndex
    ) throws DBException {
        DBSEntityReferrer ownSide;
        if (reverse) {
            DBSEntityConstraint refConstraint = association.getReferencedConstraint();
            if (!(refConstraint instanceof DBSEntityReferrer referrer)) {
                return null;
            }
            ownSide = referrer;
        } else {
            if (!(association instanceof DBSEntityReferrer associationRef)) {
                return null;
            }
            ownSide = associationRef;
        }
        List<? extends DBSEntityAttributeRef> attrs = ownSide.getAttributeReferences(monitor);
        if (attrs == null || attrs.isEmpty()) {
            return null;
        }
        List<Integer> indexList = new ArrayList<>(attrs.size());
        for (DBSEntityAttributeRef attrRef : attrs) {
            Integer idx = attrToIndex.get(attrRef.getAttribute());
            if (idx == null) {
                return null;
            }
            indexList.add(idx);
        }
        return indexList;
    }
}

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
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.DBSEntityAssociation;
import org.jkiss.dbeaver.model.struct.DBSEntityConstraint;
import org.jkiss.dbeaver.model.struct.rdb.DBSCatalog;
import org.jkiss.dbeaver.model.struct.rdb.DBSSchema;

import java.util.List;

public class WebSQLQueryResultAssociation {

    private static final Log log = Log.getLog(WebSQLQueryResultAssociation.class);

    @Nullable
    private final WebSession session;
    @NotNull
    private final DBSEntityAssociation association;
    private final boolean reverse;
    @NotNull
    private final List<WebSQLReferenceColumnMapping> columnMapping;

    public WebSQLQueryResultAssociation(
        @Nullable WebSession session,
        @NotNull DBSEntityAssociation association,
        boolean reverse,
        @NotNull List<WebSQLReferenceColumnMapping> columnMapping
    ) {
        this.session = session;
        this.association = association;
        this.reverse = reverse;
        this.columnMapping = columnMapping;
    }

    @Property
    public boolean isReference() {
        return reverse;
    }

    @NotNull
    @Property
    public String getAssociationName() {
        return association.getName();
    }

    @Nullable
    @Property
    public String getTargetCatalogName() {
        DBSEntity targetEntity = getTargetEntity();
        if (targetEntity == null) {
            return null;
        }
        DBSCatalog catalog = DBUtils.getParentOfType(DBSCatalog.class, targetEntity);
        return catalog == null ? null : catalog.getName();
    }

    @Nullable
    @Property
    public String getTargetSchemaName() {
        DBSEntity targetEntity = getTargetEntity();
        if (targetEntity == null) {
            return null;
        }
        DBSSchema schema = DBUtils.getParentOfType(DBSSchema.class, targetEntity);
        return schema == null ? null : schema.getName();
    }

    @Nullable
    @Property
    public String getTargetEntityName() {
        DBSEntity targetEntity = getTargetEntity();
        return targetEntity == null ? null : targetEntity.getName();
    }

    @Nullable
    @Property
    public String getTargetNodePath() {
        if (session == null) {
            return null;
        }
        DBSEntity targetEntity = getTargetEntity();
        if (targetEntity == null) {
            return null;
        }
        try {
            DBNNode node = session.getNavigatorModelOrThrow()
                .getNodeByObject(session.getProgressMonitor(), targetEntity, false);
            return node == null ? null : node.getNodeUri();
        } catch (DBException e) {
            log.debug("Error resolving navigator node for entity " + targetEntity.getName(), e);
            return null;
        }
    }

    @NotNull
    @Property
    public List<WebSQLReferenceColumnMapping> getColumnMapping() {
        return columnMapping;
    }

    @Nullable
    private DBSEntity getTargetEntity() {
        if (reverse) {
            return association.getParentObject();
        }
        DBSEntityConstraint referencedConstraint = association.getReferencedConstraint();
        if (referencedConstraint == null) {
            return null;
        }
        return referencedConstraint.getParentObject();
    }
}

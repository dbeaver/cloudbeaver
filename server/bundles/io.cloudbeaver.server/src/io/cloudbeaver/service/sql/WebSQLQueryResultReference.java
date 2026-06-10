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
import org.jkiss.dbeaver.model.DBPEvaluationContext;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.DBSEntityAssociation;
import org.jkiss.dbeaver.model.struct.DBSEntityConstraint;

import java.util.List;

public class WebSQLQueryResultReference {

    private static final Log log = Log.getLog(WebSQLQueryResultReference.class);

    @Nullable
    private final WebSession session;
    @NotNull
    private final DBSEntityAssociation association;
    private final boolean reverse;
    @NotNull
    private final List<Integer> columnIndexList;

    public WebSQLQueryResultReference(
        @Nullable WebSession session,
        @NotNull DBSEntityAssociation association,
        boolean reverse,
        @NotNull List<Integer> columnIndexList
    ) {
        this.session = session;
        this.association = association;
        this.reverse = reverse;
        this.columnIndexList = columnIndexList;
    }

    @NotNull
    @Property
    public String getAssociationName() {
        return association.getName();
    }

    @Nullable
    @Property
    public String getTargetEntityName() {
        DBSEntity targetEntity = getTargetEntity();
        if (targetEntity == null) {
            return null;
        }
        return DBUtils.getObjectFullName(targetEntity, DBPEvaluationContext.UI);
    }


    @Nullable
    @Property
    public String getNodePath() {
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
    public List<Integer> getColumnIndexList() {
        return columnIndexList;
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

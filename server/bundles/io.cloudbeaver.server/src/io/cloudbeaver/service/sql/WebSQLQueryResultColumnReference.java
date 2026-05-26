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

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPEvaluationContext;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.DBSEntityAssociation;
import org.jkiss.dbeaver.model.struct.DBSEntityConstraint;

/**
 * Web SQL query result column reference.
 */
public class WebSQLQueryResultColumnReference {

    @NotNull
    private final DBSEntityAssociation association;
    private final boolean reverse;

    public WebSQLQueryResultColumnReference(@NotNull DBSEntityAssociation association, boolean reverse) {
        this.association = association;
        this.reverse = reverse;
    }

    @NotNull
    @Property
    public String getAssociationName() {
        return association.getName();
    }

    /**
     * Matches desktop {@code ReferencesResultsContainer.ReferenceKey.isReference}: true for reverse
     * references (other entity's FK points to this column), false for forward foreign keys.
     */
    @Property
    public boolean isReference() {
        return reverse;
    }

    @Nullable
    @Property
    public String getTargetEntityName() {
        DBSEntity targetEntity;
        if (reverse) {
            targetEntity = association.getParentObject();
        } else {
            DBSEntityConstraint referencedConstraint = association.getReferencedConstraint();
            if (referencedConstraint == null) {
                return null;
            }
            targetEntity = referencedConstraint.getParentObject();
        }
        if (targetEntity == null) {
            return null;
        }
        return DBUtils.getObjectFullName(targetEntity, DBPEvaluationContext.UI);
    }
}

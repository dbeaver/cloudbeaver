/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2021 DBeaver Corp and others
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

import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPEvaluationContext;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDAttributeConstraint;
import org.jkiss.dbeaver.model.data.DBDDataFilter;
import org.jkiss.dbeaver.model.exec.DBCLogicalOperator;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.DBSEntityAttribute;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Web SQL data filter.
 */
public class WebSQLDataFilter {

    private static final int DEFAULT_ROWS_NUMBER = 200;
    private static final int MAX_ROWS_NUMBER = 100000;


    private int offset;
    private int limit ;
    private String where;
    private final List<WebSQLDataFilterConstraint> constraints = new ArrayList<>();

    public WebSQLDataFilter() {
        this.offset = 0;
        this.limit = DEFAULT_ROWS_NUMBER;
    }

    public WebSQLDataFilter(Map<String, Object> filterProps) {
        this.offset = CommonUtils.toInt(filterProps.get("offset"));
        this.limit = CommonUtils.toInt(filterProps.get("limit"));
        if (this.limit <= 0) {
            this.limit = DEFAULT_ROWS_NUMBER;
        } else if (this.limit > MAX_ROWS_NUMBER) {
            this.limit = MAX_ROWS_NUMBER;
        }
        this.where = CommonUtils.toString(filterProps.get("where"), null);
        Object constraints = filterProps.get("constraints");
        if (constraints instanceof Collection) {
            for (Object constrItem : (Collection)constraints) {
                if (constrItem instanceof Map) {
                    this.constraints.add(
                        new WebSQLDataFilterConstraint((Map<String, Object>)constrItem));
                }
            }
        }
    }

    public int getOffset() {
        return offset;
    }

    public void setOffset(int offset) {
        this.offset = offset;
    }

    public int getLimit() {
        return limit;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }

    public List<WebSQLDataFilterConstraint> getConstraints() {
        return constraints;
    }

    public String getWhere() {
        return where;
    }

    public DBDDataFilter makeDataFilter(DBRProgressMonitor monitor, DBSDataContainer dataContainer) throws DBException {
        DBDDataFilter dataFilter = new DBDDataFilter();
        dataFilter.setWhere(where);
        if (!CommonUtils.isEmpty(constraints)) {
            List<DBDAttributeConstraint> dbdConstraints = new ArrayList<>();
            for (WebSQLDataFilterConstraint webConstr : constraints) {
                DBDAttributeConstraint dbConstraint;
                if (dataContainer instanceof DBSEntity) {
                    DBSEntityAttribute attribute = ((DBSEntity) dataContainer).getAttribute(monitor, webConstr.getAttribute());
                    if (attribute == null) {
                        throw new DBException("Attribute '" + webConstr.getAttribute() + "' not found in '" + DBUtils.getObjectFullName(dataContainer, DBPEvaluationContext.UI) + "'");
                    }
                    dbConstraint = new DBDAttributeConstraint(attribute, -1);
                } else {
                    dbConstraint = new DBDAttributeConstraint(webConstr.getAttribute(), -1);
                }
                dbConstraint.setPlainNameReference(true);

                if (webConstr.getOrderPosition() != null) {
                    dbConstraint.setOrderPosition(webConstr.getOrderPosition());
                }
                if (webConstr.getOrderAsc() != null) {
                    dbConstraint.setOrderDescending(!webConstr.getOrderAsc());
                }
                dbConstraint.setCriteria(webConstr.getCriteria());
                if (webConstr.getOperator() != null) {
                    dbConstraint.setOperator(CommonUtils.valueOf(DBCLogicalOperator.class, webConstr.getOperator()));
                }
                if (webConstr.getValue() != null) {
                    dbConstraint.setValue(webConstr.getValue());
                }
                dbdConstraints.add(dbConstraint);
            }
            dataFilter.addConstraints(dbdConstraints);
        }
        return dataFilter;
    }
}

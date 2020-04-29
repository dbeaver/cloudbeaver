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

import org.jkiss.utils.CommonUtils;

import java.util.Map;

/**
 * Web SQL data filter constraint.
 */
public class WebSQLDataFilterConstraint {

    private String attribute;
    private Integer orderPosition;
    private Boolean orderAsc;

    private String criteria;
    private String operator;
    private Object value;

    public WebSQLDataFilterConstraint(Map<String, Object> map) {
        this.attribute = CommonUtils.toString(map.get("attribute"));
        this.orderPosition = map.containsKey("orderPosition") ?
            CommonUtils.toInt(map.get("orderPosition")) + 1 : // Use position + 1 because 0 means no ordering (because of legacy compatibility)
            null;
        this.orderAsc = map.containsKey("orderAsc") ? CommonUtils.toBoolean(map.get("orderAsc")) : null;

        this.criteria = CommonUtils.toString(map.get("criteria"), null);
        this.operator = CommonUtils.toString(map.get("operator"), null);
        this.value = CommonUtils.toString(map.get("value"), null);
    }

    public String getAttribute() {
        return attribute;
    }

    public Integer getOrderPosition() {
        return orderPosition;
    }

    public Boolean getOrderAsc() {
        return orderAsc;
    }

    public String getCriteria() {
        return criteria;
    }

    public String getOperator() {
        return operator;
    }

    public Object getValue() {
        return value;
    }
}

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

import org.jkiss.dbeaver.model.gis.DBGeometry;
import org.jkiss.utils.CommonUtils;

import java.util.Map;

/**
 * Web SQL data filter constraint.
 */
public class WebSQLDataFilterConstraint {

    private Integer attributePosition;
    private Integer orderPosition;
    private Boolean orderAsc;

    private String criteria;
    private String operator;
    private Object value;

    public WebSQLDataFilterConstraint(Map<String, Object> map) {
        this.attributePosition = CommonUtils.toInt(map.get("attributePosition"));
        this.orderPosition = map.containsKey("orderPosition") ?
                CommonUtils.toInt(map.get("orderPosition")) + 1 : // Use position + 1 because 0 means no ordering (because of legacy compatibility)
                null;
        this.orderAsc = map.containsKey("orderAsc") ? CommonUtils.toBoolean(map.get("orderAsc")) : null;

        this.criteria = CommonUtils.toString(map.get("criteria"), null);
        this.operator = CommonUtils.toString(map.get("operator"), null);
        Object value = map.get("value");
        if (value instanceof Map) {
            Map mappedValue = (Map) value;
            //creates new geometry object if the type of the value is "geometry"
            if (WebSQLConstants.VALUE_TYPE_GEOMETRY.equals(mappedValue.get(WebSQLConstants.VALUE_TYPE_ATTR))) {
                this.value = new DBGeometry(
                        mappedValue.get(WebSQLConstants.ATTR_TEXT),
                        CommonUtils.toInt(mappedValue.get(WebSQLConstants.ATTR_SRID)),
                        (Map<String, Object>) mappedValue.get(WebSQLConstants.ATTR_PROPERTIES));
            }

        } else {
            this.value = CommonUtils.toString(value, null);
        }

    }

    public Integer getAttributePosition() {
        return attributePosition;
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

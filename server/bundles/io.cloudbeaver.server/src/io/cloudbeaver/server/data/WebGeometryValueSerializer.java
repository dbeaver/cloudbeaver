/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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

package io.cloudbeaver.server.data;

import io.cloudbeaver.service.sql.DBWValueSerializer;
import io.cloudbeaver.service.sql.WebSQLConstants;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.exec.DBCSession;
import org.jkiss.dbeaver.model.gis.DBGeometry;
import org.jkiss.dbeaver.model.struct.DBSTypedObject;
import org.jkiss.utils.CommonUtils;

import java.util.Map;

public class WebGeometryValueSerializer implements DBWValueSerializer<DBGeometry> {
    @NotNull
    @Override
    public DBGeometry deserializeValue(
        @NotNull DBCSession session,
        DBSTypedObject attribute,
        @NotNull Map<String, Object> webValue
    ) throws DBCException {
        if (attribute instanceof DBDAttributeBinding) {
            Object tempValue = ((DBDAttributeBinding) attribute).getValueHandler().getValueFromObject(
                session,
                attribute,
                webValue.get(WebSQLConstants.ATTR_TEXT), false, true);
            if (tempValue instanceof DBGeometry) {
                return (DBGeometry) tempValue;
            }
        }
        return new DBGeometry(
            webValue.get(WebSQLConstants.ATTR_TEXT),
            CommonUtils.toInt(webValue.get(WebSQLConstants.ATTR_SRID)),
            JSONUtils.getObject(webValue, WebSQLConstants.ATTR_PROPERTIES));
    }
}

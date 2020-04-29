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

import io.cloudbeaver.server.CBConstants;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.*;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.gis.DBGeometry;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSAttributeBase;
import org.jkiss.dbeaver.model.struct.DBSTypedObject;
import org.jkiss.dbeaver.utils.ContentUtils;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Web SQL utils.
 */
public class WebSQLUtils {

    private static final Log log = Log.getLog(WebSQLUtils.class);

    public static Object makeWebCellValue(DBRProgressMonitor monitor, DBSTypedObject type, Object cellValue) throws DBCException {
        if (cellValue instanceof Date) {
            return CBConstants.ISO_DATE_FORMAT.format(cellValue);
        }
        if (cellValue instanceof DBDValue) {
            DBDValue dbValue = (DBDValue) cellValue;
            if (dbValue.isNull()) {
                return null;
            }
            if (dbValue instanceof DBDComplexValue) {
                return serializeComplexValue(monitor, (DBDComplexValue)dbValue);
            } else if (dbValue instanceof DBGeometry) {
                return serializeGeometryValue((DBGeometry)dbValue);
            } else if (dbValue instanceof DBDContent) {
                return serializeContentValue(monitor, (DBDContent)dbValue);
            } else if (dbValue instanceof DBDDocument) {
                return serializeDocumentValue((DBDDocument)dbValue);
            }
        }
        return cellValue;
    }

    private static Object serializeComplexValue(DBRProgressMonitor monitor, DBDComplexValue value) throws DBCException {
        if (value instanceof DBDCollection) {
            DBDCollection collection = (DBDCollection) value;
            int size = collection.getItemCount();
            Object[] items = new Object[size];
            for (int i = 0; i < size; i++) {
                items[i] = makeWebCellValue(monitor, collection.getComponentType(), collection.getItem(i));
            }
            return items;
        } else if (value instanceof DBDComposite) {
            DBDComposite composite = (DBDComposite)value;
            Map<String, Object> map = new LinkedHashMap<>();
            for (DBSAttributeBase attr : composite.getAttributes()) {
                map.put(attr.getName(), makeWebCellValue(monitor, attr, composite.getAttributeValue(attr)));
            }
            return map;
        }
        return value.toString();
    }

    private static Object serializeContentValue(DBRProgressMonitor monitor, DBDContent value) throws DBCException {
        return ContentUtils.getContentStringValue(monitor, value);
    }

    private static Object serializeDocumentValue(DBDDocument value) {
        return value;
    }

    private static Object serializeGeometryValue(DBGeometry value) {
        return value.toString();
    }

}

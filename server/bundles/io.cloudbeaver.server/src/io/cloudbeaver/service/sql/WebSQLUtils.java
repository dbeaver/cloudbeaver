/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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

import io.cloudbeaver.model.app.ServletAppConfiguration;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.utils.CBModelConstants;
import io.cloudbeaver.utils.ServletAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPEvaluationContext;
import org.jkiss.dbeaver.model.data.*;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.exec.DBCSession;
import org.jkiss.dbeaver.model.gis.DBGeometry;
import org.jkiss.dbeaver.model.gis.GisConstants;
import org.jkiss.dbeaver.model.gis.GisTransformUtils;
import org.jkiss.dbeaver.model.struct.DBSAttributeBase;
import org.jkiss.dbeaver.model.struct.DBSTypedObject;
import org.jkiss.dbeaver.utils.ContentUtils;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.Base64;
import org.jkiss.utils.CommonUtils;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.util.*;

/**
 * Web SQL utils.
 */
public class WebSQLUtils {

    private static final Log log = Log.getLog(WebSQLUtils.class);

    public static Object makeWebCellValue(WebSession session, DBSTypedObject type, Object cellValue, WebDataFormat dataFormat) throws DBCException {
        if (type instanceof DBDAttributeBinding &&
            (cellValue instanceof Date || cellValue instanceof Number)) {
            if (cellValue instanceof BigDecimal) {
                cellValue = ((BigDecimal) cellValue).stripTrailingZeros();
            }
            return ((DBDAttributeBinding) type).getValueHandler().getValueDisplayString(type, cellValue, DBDDisplayFormat.EDIT);
        }

        if (cellValue instanceof Boolean) {
            return cellValue;
        }
        if (cellValue instanceof Date) {
            return CBModelConstants.ISO_DATE_FORMAT.format(((Date) cellValue).toInstant());
        } else if (cellValue instanceof Number) {
            if (cellValue instanceof Double) {
                return CommonUtils.niceFormatDouble((Double) cellValue);
            } else if (cellValue instanceof Float) {
                return CommonUtils.niceFormatDouble((Float) cellValue);
            } else if (cellValue instanceof BigDecimal) {
                return ((BigDecimal) cellValue).toPlainString();
            }
            return cellValue.toString();
        }
        if (cellValue instanceof DBDValue) {
            DBDValue dbValue = (DBDValue) cellValue;
            if (dbValue.isNull()) {
                return null;
            }
            else if (dbValue instanceof DBDDocument) {
                return serializeDocumentValue(session, (DBDDocument) dbValue);
            } else if (dbValue instanceof DBDComplexValue) {
                return serializeComplexValue(session, type, (DBDComplexValue)dbValue, dataFormat);
            } else if (dbValue instanceof DBGeometry) {
                return serializeGeometryValue((DBGeometry)dbValue);
            } else if (dbValue instanceof DBDContent) {
                return serializeContentValue(session, (DBDContent)dbValue);
            }
        }
        return cellValue == null ? null : serializeStringValue(cellValue);
    }

    private static Object serializeComplexValue(WebSession session, DBSTypedObject type, DBDComplexValue value, WebDataFormat dataFormat) throws DBCException {
        if (value instanceof DBDCollection) {
            if (type instanceof DBDAttributeBinding) {
                DBDValueHandler valueHandler = ((DBDAttributeBinding) type).getValueHandler();
                return valueHandler.getValueDisplayString(type, value, DBDDisplayFormat.EDIT);
            }
            DBDCollection collection = (DBDCollection) value;
            int size = collection.getItemCount();
            Object[] items = new Object[size];
            for (int i = 0; i < size; i++) {
                items[i] = makeWebCellValue(session, collection.getComponentType(), collection.getItem(i), dataFormat);
            }

            Map<String, Object> map = createMapOfType(WebSQLConstants.VALUE_TYPE_COLLECTION);
            map.put("value", items);
            return map;
        } else if (value instanceof DBDComposite) {
            DBDComposite composite = (DBDComposite)value;
            Map<String, Object> struct = new LinkedHashMap<>();
            for (DBSAttributeBase attr : composite.getAttributes()) {
                struct.put(attr.getName(), makeWebCellValue(session, attr, composite.getAttributeValue(attr), dataFormat));
            }

            Map<String, Object> map = createMapOfType(WebSQLConstants.VALUE_TYPE_MAP);
            map.put("value", struct);
            return map;
        }
        return value.toString();
    }

    @NotNull
    private static Map<String, Object> createMapOfType(String type) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put(WebSQLConstants.VALUE_TYPE_ATTR, type);
        return map;
    }

    private static Map<String, Object> serializeDocumentValue(WebSession session, DBDDocument document) throws DBCException {
        String documentData;
        try {
            StringWriter writer = new StringWriter();
            document.serializeDocument(session.getProgressMonitor(), writer);
            documentData = writer.toString();
        } catch (Exception e) {
            throw new DBCException("Error serializing document", e);
        }

        Map<String, Object> map = createMapOfType(WebSQLConstants.VALUE_TYPE_DOCUMENT);
        map.put("id", CommonUtils.toString(document.getDocumentId()));
        map.put("contentType", document.getDocumentContentType());
        map.put("properties", Collections.emptyMap());
        map.put(WebSQLConstants.ATTR_DATA, documentData);
        return map;
    }

    private static Object serializeContentValue(WebSession session, DBDContent value) throws DBCException {

        Map<String, Object> map = createMapOfType(WebSQLConstants.VALUE_TYPE_CONTENT);
        if (ContentUtils.isTextContent(value)) {
            String stringValue = ContentUtils.getContentStringValue(session.getProgressMonitor(), value);
            int textPreviewMaxLength = CommonUtils.toInt(
                ServletAppUtils.getServletApplication()
                    .getAppConfiguration()
                    .getResourceQuota(WebSQLConstants.QUOTA_PROP_TEXT_PREVIEW_MAX_LENGTH),
                WebSQLConstants.TEXT_PREVIEW_MAX_LENGTH
            );
            if (stringValue != null && stringValue.length() > textPreviewMaxLength) {
                stringValue =  stringValue.substring(0, textPreviewMaxLength);
            }
            map.put(WebSQLConstants.ATTR_TEXT, stringValue);
        } else {
            map.put(WebSQLConstants.ATTR_BINARY, true);
            byte[] binaryValue = ContentUtils.getContentBinaryValue(session.getProgressMonitor(), value);
            if (binaryValue != null) {
                byte[] previewValue = binaryValue;
                // gets parameters from the configuration file
                ServletAppConfiguration config = ServletAppUtils.getServletApplication().getAppConfiguration();
                // the max length of the text preview
                int textPreviewMaxLength = CommonUtils.toInt(
                    config.getResourceQuota(
                        WebSQLConstants.QUOTA_PROP_TEXT_PREVIEW_MAX_LENGTH), WebSQLConstants.TEXT_PREVIEW_MAX_LENGTH);
                if (previewValue.length > textPreviewMaxLength) {
                    previewValue = Arrays.copyOf(previewValue, textPreviewMaxLength);
                }
                map.put(WebSQLConstants.ATTR_TEXT, GeneralUtils.convertToString(previewValue, 0, previewValue.length));
                // the max length of the binary preview
                int binaryPreviewMaxLength = CommonUtils.toInt(
                    config.getResourceQuota(
                        WebSQLConstants.QUOTA_PROP_BINARY_PREVIEW_MAX_LENGTH),
                    WebSQLConstants.BINARY_PREVIEW_MAX_LENGTH);
                byte[] inlineValue = binaryValue;
                if (inlineValue.length > binaryPreviewMaxLength) {
                    inlineValue = Arrays.copyOf(inlineValue, textPreviewMaxLength);
                }
                map.put(WebSQLConstants.ATTR_BINARY, Base64.encode(inlineValue));
            } else {
                map.put(WebSQLConstants.ATTR_TEXT, null);
            }
        }
        map.put("contentType", value.getContentType());
        map.put("contentLength", value.getContentLength());
        return map;
    }

    private static Object serializeGeometryValue(DBGeometry value) {
        Map<String, Object> map = createMapOfType(WebSQLConstants.VALUE_TYPE_GEOMETRY);
        map.put("srid", value.getSRID());
        map.put(WebSQLConstants.ATTR_TEXT, value.toString());
        map.put("properties", value.getProperties());

        DBGeometry xValue = GisTransformUtils.transformToSRID(value, GisConstants.SRID_4326);
        if (xValue != null && xValue != value) {
            map.put("mapText", xValue.toString());
        }
        return map;
    }

    /**
     * Serializes original value from db to web form
     *
     * @param value original value
     * @return web form value
     */
    public static Object serializeStringValue(Object value) {
        int textPreviewMaxLength = CommonUtils.toInt(
            ServletAppUtils.getServletApplication()
                .getAppConfiguration()
                .getResourceQuota(WebSQLConstants.QUOTA_PROP_TEXT_PREVIEW_MAX_LENGTH),
            WebSQLConstants.TEXT_PREVIEW_MAX_LENGTH
        );
        String stringValue = value.toString();
        if (stringValue.length() < textPreviewMaxLength) {
            return value.toString();
        }
        Map<String, Object> map = createMapOfType(WebSQLConstants.VALUE_TYPE_CONTENT);
        map.put(WebSQLConstants.ATTR_TEXT, stringValue.substring(0, textPreviewMaxLength));
        map.put("contentLength", GeneralUtils.convertToBytes(stringValue).length);
        return map;
    }

    public static Object makePlainCellValue(DBCSession session, DBSTypedObject attribute, Object value) throws DBCException {
        if (value instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) value;
            Object typeAttr = map.get(WebSQLConstants.VALUE_TYPE_ATTR);
            if (typeAttr instanceof String) {
                switch ((String)typeAttr) {
                    case WebSQLConstants.VALUE_TYPE_CONTENT: {
                        if (map.get(WebSQLConstants.ATTR_BINARY) != null) {
                            throw new DBCException("Binary content edit is not supported yet");
                        }
                        value = map.get(WebSQLConstants.ATTR_TEXT);
                        break;
                    }
                    default: {
                        DBWValueSerializer<?> valueSerializer = WebServiceRegistry.getInstance().createValueSerializer((String) typeAttr);
                        if (valueSerializer == null) {
                            throw new DBCException("Value type '" + typeAttr + "' edit is not supported yet");
                        }
                        value = valueSerializer.deserializeValue(session, attribute, map);
                    }
                }
            }
        }
        return value;
    }

    /**
     * Returns fully qualified name for a column.
     */
    @NotNull
    public static String getColumnName(@NotNull DBDAttributeBinding binding) {
        return binding.getFullyQualifiedName(DBPEvaluationContext.UI);
    }
}

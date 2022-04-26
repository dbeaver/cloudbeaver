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

/**
 * Web SQL constants.
 */
public class WebSQLConstants {

    public static final String QUOTA_PROP_ROW_LIMIT = "sqlResultSetRowsLimit";
    public static final String QUOTA_PROP_MEMORY_LIMIT = "sqlResultSetMemoryLimit";
    public static final String QUOTA_PROP_QUERY_LIMIT = "sqlMaxRunningQueries";
    public static final String QUOTA_PROP_TEXT_PREVIEW_MAX_LENGTH = "sqlTextPreviewMaxLength";
    public static final String QUOTA_PROP_BINARY_PREVIEW_MAX_LENGTH = "sqlBinaryPreviewMaxLength";
    public static final String QUOTA_PROP_RM_FILE_SIZE_LIMIT = "resourceManagerFileSizeLimit";

    public static final int TEXT_PREVIEW_MAX_LENGTH = 4 * 1024;
    public static final int BINARY_PREVIEW_MAX_LENGTH = 255 * 1024;

    public static final String VALUE_TYPE_ATTR = "$type";

    public static final String VALUE_TYPE_COLLECTION = "collection";
    public static final String VALUE_TYPE_MAP = "map";
    public static final String VALUE_TYPE_DOCUMENT = "document";
    public static final String VALUE_TYPE_CONTENT = "content";
    public static final String VALUE_TYPE_GEOMETRY = "geometry";

    public static final String ATTR_TEXT = "text";
    public static final String ATTR_BINARY = "binary";
    public static final String ATTR_DATA = "data";
    public static final String ATTR_SRID = "srid";
    public static final String ATTR_PROPERTIES = "properties";

}

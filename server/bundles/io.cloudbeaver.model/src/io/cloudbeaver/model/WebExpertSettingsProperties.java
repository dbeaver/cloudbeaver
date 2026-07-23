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
package io.cloudbeaver.model;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.connection.DBPDriverConstants;
import org.jkiss.dbeaver.model.meta.IPropertyValueListProvider;
import org.jkiss.dbeaver.model.meta.IPropertyValueValidator;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.utils.CommonUtils;

/**
 * Web expert settings properties. Class for returning filtered expert settings properties in web interface.
 */
public class WebExpertSettingsProperties implements DBPObject {
    public static final String PROP_READ_ONLY = "readOnly";
    public static final String PROP_AUTO_COMMIT = "autocommit";
    public static final String PROP_AUTO_COMMIT_MODE = "autoCommitMode";
    public static final String PROP_KEEP_ALIVE_INTERVAL = "keepAliveInterval";
    public static final String PROP_DEFAULT_CATALOG = "defaultCatalogName";
    public static final String PROP_DEFAULT_SCHEMA = "defaultSchemaName";

    private final DBPDriver driver;

    public WebExpertSettingsProperties(@NotNull DBPDriver driver) {
        this.driver = driver;
    }

    @Property(order = 1, id = PROP_KEEP_ALIVE_INTERVAL, visibleIf = KeepAliveIntervalFieldValidator.class)
    public int getKeepAliveInterval() {
        return 0;
    }

    @NotNull
    @Property(
        order = 2,
        id = PROP_AUTO_COMMIT_MODE,
        visibleIf = AutoCommitFieldValidator.class,
        listProvider = AutoCommitListProvider.class
    )
    public AutoCommitMode isAutoCommitMode() {
        return AutoCommitMode.DEFAULT;
    }

    @Property(order = 3, id = PROP_READ_ONLY, visibleIf = ReadOnlyFieldValidator.class)
    public boolean isReadOnly() {
        return false;
    }

    @Nullable
    @Property(order = 4, id = PROP_DEFAULT_CATALOG, visibleIf = DefaultCatalogFieldVisibleValidator.class)
    public String getDefaultCatalog() {
        return null;
    }

    @Nullable
    @Property(order = 5, id = PROP_DEFAULT_SCHEMA, visibleIf = DefaultSchemaFieldVisibleValidator.class)
    public String getDefaultSchema() {
        return null;
    }


    public static class KeepAliveIntervalFieldValidator implements IPropertyValueValidator<WebExpertSettingsProperties, Object> {
        @Override
        public boolean isValidValue(@NotNull WebExpertSettingsProperties object, @Nullable Object value) throws IllegalArgumentException {
            return CommonUtils.toBoolean(!object.driver.isEmbedded(), true);
        }
    }

    public static class AutoCommitFieldValidator implements IPropertyValueValidator<WebExpertSettingsProperties, Object> {
        @Override
        public boolean isValidValue(@NotNull WebExpertSettingsProperties object, @Nullable Object value) throws IllegalArgumentException {
            return CommonUtils.toBoolean(object.driver.getDriverParameter(DBPDriverConstants.PARAM_SUPPORTS_TRANSACTIONS), true);
        }
    }

    public static class ReadOnlyFieldValidator implements IPropertyValueValidator<WebExpertSettingsProperties, Object> {
        @Override
        public boolean isValidValue(@NotNull WebExpertSettingsProperties object, @Nullable Object value) throws IllegalArgumentException {
            return CommonUtils.toBoolean(object.driver.getDriverParameter(DBPDriverConstants.PARAM_SUPPORTS_READ_ONLY_MODE), true);
        }
    }

    public static class DefaultCatalogFieldVisibleValidator implements IPropertyValueValidator<WebExpertSettingsProperties, Object> {
        @Override
        public boolean isValidValue(@NotNull WebExpertSettingsProperties object, @Nullable Object value) throws IllegalArgumentException {
            return CommonUtils.toBoolean(object.driver.getDriverParameter(DBPDriverConstants.PARAM_SUPPORTS_CATALOG_SELECTION), true);
        }
    }

    public static class DefaultSchemaFieldVisibleValidator implements IPropertyValueValidator<WebExpertSettingsProperties, Object> {
        @Override
        public boolean isValidValue(@NotNull WebExpertSettingsProperties object, @Nullable Object value) throws IllegalArgumentException {
            return CommonUtils.toBoolean(object.driver.getDriverParameter(DBPDriverConstants.PARAM_SUPPORTS_SCHEMA_SELECTION), true);
        }
    }

    public static class AutoCommitListProvider implements IPropertyValueListProvider<WebExpertSettingsProperties> {

        @Override
        public boolean allowCustomValue() {
            return false;
        }

        @Nullable
        @Override
        public Object[] getPossibleValues(@Nullable WebExpertSettingsProperties object) {
            return AutoCommitMode.values();
        }
    }
}

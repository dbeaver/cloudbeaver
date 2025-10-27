package io.cloudbeaver.model;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.connection.DBPDriverConstants;
import org.jkiss.dbeaver.model.meta.IPropertyValueValidator;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.utils.CommonUtils;

/**
 * Web expert settings properties. Class for returning filtered expert settings properties in web interface.
 */
public class WebExpertSettingsProperties implements DBPObject {
    public static final String PROP_READ_ONLY = "readOnly";
    public static final String PROP_AUTO_COMMIT = "autocommit";
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

    @Property(order = 2, id = PROP_AUTO_COMMIT, visibleIf = AutoCommitFieldValidator.class)
    public boolean isAutoCommit() {
        return true;
    }

    @Property(order = 3, id = PROP_READ_ONLY, visibleIf = ReadOnlyFieldValidator.class)
    public boolean isReadOnly() {
        return false;
    }

    @Property(order = 4, id = PROP_DEFAULT_CATALOG, visibleIf = DefaultCatalogFieldVisibleValidator.class)
    public String getDefaultCatalog() {
        return null;
    }

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
}

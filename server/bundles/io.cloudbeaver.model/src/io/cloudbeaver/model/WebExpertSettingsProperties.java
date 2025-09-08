package io.cloudbeaver.model;

import org.jkiss.code.NotNull;
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
    public static final String PROP_AUTO_COMMIT = "autoCommit";
    public static final String PROP_KEEP_ALIVE_INTERVAL = "keepAliveInterval";
    public static final String PROP_DEFAULT_CATALOG = "defaultCatalog";
    public static final String PROP_DEFAULT_SCHEMA = "defaultSchema";

    private final DBPDriver driver;

    public WebExpertSettingsProperties(@NotNull DBPDriver driver) {
        this.driver = driver;
    }

    @Property(viewable = true, order = 1, visibleIf = KeepAliveIntervalFieldValidator.class)
    public int getKeepAliveInterval() {
        return 0;
    }

    @Property(viewable = true, order = 2, visibleIf = AutoCommitFieldValidator.class)
    public boolean isAutoCommit() {
        return true;
    }

    @Property(viewable = true, order = 3, visibleIf = ReadOnlyFieldValidator.class)
    public boolean isReadOnly() {
        return false;
    }

    @Property(viewable = true, order = 4, visibleIf = DefaultCatalogFieldVisibleValidator.class)
    public String getDefaultCatalog() {
        return null;
    }

    @Property(viewable = true, order = 5, visibleIf = DefaultSchemaFieldVisibleValidator.class)
    public String getDefaultSchema() {
        return null;
    }


    public static class KeepAliveIntervalFieldValidator implements IPropertyValueValidator<WebExpertSettingsProperties, Object> {
        @Override
        public boolean isValidValue(WebExpertSettingsProperties object, Object value) throws IllegalArgumentException {
            return CommonUtils.toBoolean(!object.driver.isEmbedded(), true);
        }
    }

    public static class AutoCommitFieldValidator implements IPropertyValueValidator<WebExpertSettingsProperties, Object> {
        @Override
        public boolean isValidValue(WebExpertSettingsProperties object, Object value) throws IllegalArgumentException {
            return CommonUtils.toBoolean(object.driver.getDriverParameter(DBPDriverConstants.PARAM_SUPPORTS_TRANSACTIONS), true);
        }
    }

    public static class ReadOnlyFieldValidator implements IPropertyValueValidator<WebExpertSettingsProperties, Object> {
        @Override
        public boolean isValidValue(WebExpertSettingsProperties object, Object value) throws IllegalArgumentException {
            return CommonUtils.toBoolean(object.driver.getDriverParameter(DBPDriverConstants.PARAM_SUPPORTS_READ_ONLY_MODE), true);
        }
    }

    public static class DefaultCatalogFieldVisibleValidator implements IPropertyValueValidator<WebExpertSettingsProperties, Object> {
        @Override
        public boolean isValidValue(WebExpertSettingsProperties object, Object value) throws IllegalArgumentException {
            return CommonUtils.toBoolean(object.driver.getDriverParameter(DBPDriverConstants.PARAM_SUPPORTS_CATALOG_SELECTION), true);
        }
    }

    public static class DefaultSchemaFieldVisibleValidator implements IPropertyValueValidator<WebExpertSettingsProperties, Object> {
        @Override
        public boolean isValidValue(WebExpertSettingsProperties object, Object value) throws IllegalArgumentException {
            return CommonUtils.toBoolean(object.driver.getDriverParameter(DBPDriverConstants.PARAM_SUPPORTS_SCHEMA_SELECTION), true);
        }
    }
}

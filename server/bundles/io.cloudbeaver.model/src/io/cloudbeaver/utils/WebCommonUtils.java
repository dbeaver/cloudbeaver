package io.cloudbeaver.utils;

import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.auth.AuthProperty;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.runtime.properties.ObjectPropertyDescriptor;
import org.jkiss.dbeaver.runtime.properties.PropertyCollector;

import java.util.Arrays;

public class WebCommonUtils {

    public static String makeIconId(@Nullable DBPImage icon) {
        return icon == null ? null : icon.getLocation();
    }

    @NotNull
    public static WebPropertyInfo[] getObjectProperties(WebSession session, DBPObject details) {
        PropertyCollector propertyCollector = new PropertyCollector(details, false);
        propertyCollector.collectProperties();
        return Arrays.stream(propertyCollector.getProperties())
            .filter(p -> !(p instanceof ObjectPropertyDescriptor && ((ObjectPropertyDescriptor) p).isHidden()))
            .map(p -> new WebPropertyInfo(session, p, propertyCollector)).toArray(WebPropertyInfo[]::new);
    }

    public static boolean isAuthPropertyApplicable(DBPPropertyDescriptor prop, boolean hasContextCredentials) {
        if (hasContextCredentials && prop instanceof ObjectPropertyDescriptor) {
            if (((ObjectPropertyDescriptor) prop).isHidden()) {
                return false;
            }
            AuthProperty authProperty = ((ObjectPropertyDescriptor) prop).getAnnotation(AuthProperty.class);
            if (authProperty != null) return !authProperty.contextProvided();
        }
        return true;
    }
}

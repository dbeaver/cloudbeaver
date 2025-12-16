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
package io.cloudbeaver.utils;

import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.access.DBACredentialsProvider;
import org.jkiss.dbeaver.model.auth.AuthProperty;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.runtime.properties.ObjectPropertyDescriptor;
import org.jkiss.dbeaver.runtime.properties.PropertyCollector;
import org.jkiss.utils.CommonUtils;

import java.util.Arrays;
import java.util.Collection;

public class WebCommonUtils {

    public static String makeIconId(@Nullable DBPImage icon) {
        return icon == null ? null : icon.getLocation();
    }

    @NotNull
    public static WebPropertyInfo[] getObjectProperties(WebSession session, DBPObject details) {
        PropertyCollector propertyCollector = new PropertyCollector(details, false);
        propertyCollector.collectProperties();
        return Arrays.stream(propertyCollector.getProperties())
            .filter(p -> !(p instanceof ObjectPropertyDescriptor objProp && objProp.isHidden()))
            .map(p -> new WebPropertyInfo(session, p, propertyCollector)).toArray(WebPropertyInfo[]::new);
    }

    public static boolean isAuthPropertyApplicable(
        DBPPropertyDescriptor prop,
        @NotNull Collection<DBACredentialsProvider> credentialsProviders
    ) {
        if (!CommonUtils.isEmpty(credentialsProviders) && prop instanceof ObjectPropertyDescriptor) {
            if (((ObjectPropertyDescriptor) prop).isHidden()) {
                return false;
            }
            AuthProperty authProperty = ((ObjectPropertyDescriptor) prop).getAnnotation(AuthProperty.class);
            if (authProperty != null) {
                var requiredContext = authProperty.authContextType();
                return CommonUtils.isEmpty(requiredContext)
                    || credentialsProviders.stream()
                    .noneMatch(provider -> provider.getAuthContextType().equals(requiredContext));
            }
        }
        return true;
    }
}

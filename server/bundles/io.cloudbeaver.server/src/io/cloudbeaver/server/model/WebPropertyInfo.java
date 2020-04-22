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
package io.cloudbeaver.server.model;

import io.cloudbeaver.server.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.*;
import org.jkiss.dbeaver.model.meta.IPropertyValueListProvider;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.preferences.DBPPropertySource;
import org.jkiss.dbeaver.runtime.properties.ObjectPropertyDescriptor;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.Array;
import java.util.*;

/**
 * Web connection info
 */
public class WebPropertyInfo {
    private WebSession session;
    private DBPPropertyDescriptor property;
    private DBPPropertySource propertySource;

    public WebPropertyInfo(WebSession session, DBPPropertyDescriptor property, DBPPropertySource propertySource) {
        this.session = session;
        this.property = property;
        this.propertySource = propertySource;
    }

    public WebPropertyInfo(WebSession session, DBPPropertyDescriptor property) {
        this.session = session;
        this.property = property;
    }

    ///////////////////////////////////
    // General properties
    ///////////////////////////////////

    @Property
    public String getId() {
        return CommonUtils.toString(property.getId());
    }

    @Property
    public String getDisplayName() {
        if (property instanceof DBPNamedObjectLocalized) {
            return ((DBPNamedObjectLocalized) property).getLocalizedName(session.getLocale());
        } else {
            return property.getDisplayName();
        }
    }

    @Property
    public String getDescription() {
        if (property instanceof DBPObjectWithDescriptionLocalized) {
            return ((DBPObjectWithDescriptionLocalized) property).getLocalizedDescription(session.getLocale());
        } else {
            return property.getDescription();
        }
    }

    @Property
    public String getCategory() {
        return property.getCategory();
    }

    @Property
    public String getType() {
        return getDataType();
    }

    @Property
    public String getDataType() {
        Class<?> dataType = property.getDataType();
        return dataType == null ? null : dataType.getSimpleName();
    }

    @Property
    public Object getDefaultValue() throws DBException {
        return getValue();
    }

    @Property
    public Object getValue() throws DBException {
        Object value = propertySource == null ? null : propertySource.getPropertyValue(session.getProgressMonitor(), property.getId());
        return value == null ? null : makePropertyValue(value);
    }

    @Property
    public Object[] getValidValues() {
        if (property instanceof IPropertyValueListProvider) {
            Object[] possibleValues = ((IPropertyValueListProvider) property).getPossibleValues(
                propertySource == null ? null : propertySource.getEditableValue());
            if (possibleValues != null) {
                Object[] validValues = new Object[possibleValues.length];
                for (int i = 0; i < possibleValues.length; i++) {
                    validValues[i] = makePropertyValue(possibleValues[i]);
                }
                return validValues;
            }
            return null;
        }
        return null;
    }

    @Property
    public String[] getFeatures() {
        List<String> features = new ArrayList<>();
        if (property instanceof ObjectPropertyDescriptor) {
            ObjectPropertyDescriptor opd = (ObjectPropertyDescriptor)property;
            if (opd.isRequired()) features.add("required");
            if (opd.isSpecific()) features.add("specific");
            if (opd.isOptional()) features.add("optional");
            if (opd.isHidden()) features.add("hidden");
            if (opd.isRemote()) features.add("remote");

            if (opd.isDateTime()) features.add("datetme");
            if (opd.isNumeric()) features.add("numeric");
            if (opd.isNameProperty()) features.add("name");

            if (opd.isMultiLine()) features.add("multiline");
            if (opd.isExpensive()) features.add("expensive");
            if (opd.isEditPossible()) features.add("editPossible");
            if (opd.isLinkPossible()) features.add("linkPossible");
            if (opd.isViewable()) features.add("viewable");
        }
        return features.toArray(new String[0]);
    }

    public boolean hasFeature(@NotNull String feature) {
        if (property instanceof ObjectPropertyDescriptor) {
            switch (feature) {
                case "required":
                    return property.isRequired();
                case "specific":
                    return ((ObjectPropertyDescriptor) property).isSpecific();
                case "optional":
                    return ((ObjectPropertyDescriptor) property).isOptional();
                case "hidden":
                    return ((ObjectPropertyDescriptor) property).isHidden();
                case "remote":
                    return property.isRemote();

                case "datetme":
                    return ((ObjectPropertyDescriptor) property).isDateTime();
                case "numeric":
                    return ((ObjectPropertyDescriptor) property).isNumeric();
                case "name":
                    return ((ObjectPropertyDescriptor) property).isNameProperty();

                case "multiline":
                    return ((ObjectPropertyDescriptor) property).isMultiLine();
                case "expensive":
                    return ((ObjectPropertyDescriptor) property).isExpensive();
                case "editPossible":
                    return ((ObjectPropertyDescriptor) property).isEditPossible();
                case "linkPossible":
                    return ((ObjectPropertyDescriptor) property).isLinkPossible();
                case "viewable":
                    return ((ObjectPropertyDescriptor) property).isViewable();
            }
        }
        return false;
    }

    public boolean hasAnyFeature(@NotNull List<String> features) {
        for (String feature : features) {
            if (hasFeature(feature)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public String toString() {
        return CommonUtils.toString(property.getId());
    }

    private Object makePropertyValue(Object value) {
        if (value == null) {
            return null;
//        } else if (value instanceof DBSObject) {
//            return new WebDatabaseObjectInfo(session, (DBSObject) value);
        } else if (value instanceof DBPObject) {
            Map<String, Object> basicInfo = new LinkedHashMap<>();
            //WebBasicObjectInfo objectInfo = new WebBasicObjectInfo();
            if (value instanceof DBPNamedObject) {
                basicInfo.put("displayName", ((DBPNamedObject) value).getName());
            } else {
                basicInfo.put("value", CommonUtils.toString(value));
            }
            if (value instanceof DBPObjectWithDescription) {
                String description = ((DBPObjectWithDescription) value).getDescription();
                if (!CommonUtils.isEmpty(description)) {
                    basicInfo.put("description", description);
                }
            }
            if (value instanceof DBPObjectWithLongId) {
                basicInfo.put("id", ((DBPObjectWithLongId) value).getObjectId());
            }
            if (value instanceof DBPQualifiedObject) {
                basicInfo.put("fullName", ((DBPQualifiedObject) value).getFullyQualifiedName(DBPEvaluationContext.UI));
            }
            if (value instanceof DBPUniqueObject) {
                basicInfo.put("uniqueName", ((DBPUniqueObject) value).getUniqueName());
            }
            return basicInfo;
        } else if (value instanceof Collection) {
            List<Object> result = new ArrayList<>();
            for (Object item : (Collection)value) {
                result.add(makePropertyValue(item));
            }
            return result;
        } else if (value.getClass().isArray()) {
            List<Object> result = new ArrayList<>();
            int length = Array.getLength(value);
            for (int i = 0; i < length; i++) {
                result.add(Array.get(value, i));
            }
            return result;
        }
        return CommonUtils.toString(value);
    }

}

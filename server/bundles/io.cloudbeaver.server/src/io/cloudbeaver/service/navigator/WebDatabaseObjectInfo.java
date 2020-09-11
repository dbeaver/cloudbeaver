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
package io.cloudbeaver.service.navigator;

import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.*;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.struct.*;
import org.jkiss.dbeaver.model.struct.rdb.DBSCatalog;
import org.jkiss.dbeaver.model.struct.rdb.DBSSchema;
import org.jkiss.dbeaver.runtime.properties.PropertyCollector;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Web connection info
 */
public class WebDatabaseObjectInfo {

    private static final Log log = Log.getLog(WebDatabaseObjectInfo.class);

    private final WebSession session;
    private final DBSObject object;

    public WebDatabaseObjectInfo(WebSession session, DBSObject object) {
        this.session = session;
        this.object = object;
    }

    ///////////////////////////////////
    // General properties
    ///////////////////////////////////

    @Property
    public String getName() {
        return object.getName();
    }

    @Property
    public String getDescription() {
        return object.getDescription();
    }

    @Property
    public String getType() {
        return object.getClass().getName();
    }

    @Property
    public WebPropertyInfo[] getProperties() {
        return filterProperties(null);
    }

    @Property
    public WebPropertyInfo[] filterProperties(@Nullable WebPropertyFilter filter) {
        PropertyCollector propertyCollector = new PropertyCollector(object, true);
        propertyCollector.setLocale(session.getLocale());
        propertyCollector.collectProperties();
        List<WebPropertyInfo> webProps = new ArrayList<>();
        for (DBPPropertyDescriptor prop : propertyCollector.getProperties()) {
            if (filter != null && !CommonUtils.isEmpty(filter.getIds()) && !filter.getIds().contains(CommonUtils.toString(prop.getId()))) {
                continue;
            }
            WebPropertyInfo webProperty = new WebPropertyInfo(session, prop, propertyCollector);
            if (filter != null) {
                if (!CommonUtils.isEmpty(filter.getFeatures()) && !webProperty.hasAnyFeature(filter.getFeatures())) {
                    continue;
                }
                if (!CommonUtils.isEmpty(filter.getCategories()) && !filter.getCategories().contains(webProperty.getCategory())) {
                    continue;
                }
            }
            webProps.add(webProperty);
        }
        return webProps.toArray(new WebPropertyInfo[0]);
    }

    ///////////////////////////////////
    // Advanced

    @Property
    public Integer getOrdinalPosition() {
        return object instanceof DBPOrderedObject ? ((DBPOrderedObject) object).getOrdinalPosition() : null;
    }

    @Property
    public String getFullyQualifiedName() {
        return object instanceof DBPQualifiedObject ? ((DBPQualifiedObject) object).getFullyQualifiedName(DBPEvaluationContext.UI) : getName();
    }

    @Property
    public String getOverloadedName() {
        return object instanceof DBPOverloadedObject ? ((DBPOverloadedObject) object).getOverloadedName() : getName();
    }

    @Property
    public String getUniqueName() {
        return object instanceof DBPUniqueObject ? ((DBPUniqueObject) object).getUniqueName() : getName();
    }

    @Property
    public String getState() {
        if (object instanceof DBPStatefulObject) {
            DBSObjectState state = ((DBPStatefulObject) object).getObjectState();
            if (state != null) {
                return state.getTitle();
            }
        }
        return null;
    }

    @Property
    public String[] getFeatures() {
        List<String> features = new ArrayList<>();
        if (object instanceof DBPScriptObject) features.add("script");
        if (object instanceof DBPScriptObjectExt) features.add("scriptExtended");
        if (object instanceof DBSDataContainer) features.add("dataContainer");
        if (object instanceof DBSDataManipulator) features.add("dataManipulator");
        if (object instanceof DBSEntity) features.add("entity");
        if (object instanceof DBSSchema) features.add("schema");
        if (object instanceof DBSCatalog) features.add("catalog");
        if (object instanceof DBSObjectContainer) features.add("objectContainer");
        if (object instanceof DBPDataSourceContainer) {
            features.add("dataSource");
            DBPDataSourceContainer dbpDataSourceContainer = (DBPDataSourceContainer) this.object;
            if (dbpDataSourceContainer.isConnected()) {
                features.add("dataSourceConnected");
            }
            if (dbpDataSourceContainer.isTemporary()) {
                features.add("dataSourceTemporary");
            }
        }
        return features.toArray(new String[0]);
    }

    @Property
    public String[] getEditors() {
        return null;
    }

}

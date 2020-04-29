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

import org.jkiss.dbeaver.Log;

import java.util.ArrayList;
import java.util.List;

/**
 * WebStructContainers
 */
public class WebStructContainers {

    private static final Log log = Log.getLog(WebStructContainers.class);

    private List<WebDatabaseObjectInfo> catalogList = new ArrayList<>();
    private List<WebDatabaseObjectInfo> schemaList = new ArrayList<>();

    public List<WebDatabaseObjectInfo> getCatalogList() {
        return catalogList;
    }

    public void setCatalogList(List<WebDatabaseObjectInfo> catalogList) {
        this.catalogList = catalogList;
    }

    public List<WebDatabaseObjectInfo> getSchemaList() {
        return schemaList;
    }

    public void setSchemaList(List<WebDatabaseObjectInfo> schemaList) {
        this.schemaList = schemaList;
    }
}

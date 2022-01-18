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
package io.cloudbeaver.service.navigator;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;

import java.util.ArrayList;
import java.util.List;


/**
 * WebCatalog
 */
public class WebCatalog {

    private static final Log log = Log.getLog(WebCatalog.class);

    private WebNavigatorNodeInfo catalog;
    private List<WebNavigatorNodeInfo> schemaList = new ArrayList<>();

    public WebCatalog(@NotNull WebNavigatorNodeInfo catalog) {
        this.catalog = catalog;
    }

    @NotNull
    public WebNavigatorNodeInfo getCatalog() {
        return catalog;
    }

    public List<WebNavigatorNodeInfo> getSchemaList() {
        return schemaList;
    }

    public void setSchemaList(List<WebNavigatorNodeInfo> schemaList) {
        this.schemaList = schemaList;
    }
}

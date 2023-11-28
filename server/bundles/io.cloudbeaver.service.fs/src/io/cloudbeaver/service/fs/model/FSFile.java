/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
package io.cloudbeaver.service.fs.model;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.fs.DBNPathBase;

import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;

public class FSFile {
    @NotNull
    private final DBNPathBase node;

    public FSFile(@NotNull DBNPathBase node) {
        this.node = node;
    }

    @Property
    public String getName() {
        return node.getNodeName();
    }

    @Property
    public long getLength() throws IOException {
        return Files.size(node.getPath());
    }

    @Property
    public boolean isFolder() {
        return Files.isDirectory(node.getPath());
    }

    @Property
    public Map<String, String> getMetaData() {
        return Map.of();
    }

    @Property
    public String getNodePath() {
        return node.getNodeItemPath();
    }
}

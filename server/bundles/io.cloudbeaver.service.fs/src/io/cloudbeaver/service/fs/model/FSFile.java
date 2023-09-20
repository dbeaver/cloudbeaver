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

import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.utils.ArrayUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

public class FSFile {
    private final Path path;

    public FSFile(Path path) {
        this.path = path;
    }

    @Property
    public String getName() {
        String[] pathParts = path.getFileName().toString().split(path.getFileSystem().getSeparator());
        if (ArrayUtils.isEmpty(pathParts)) {
            return "";
        }
        return pathParts[pathParts.length - 1];
    }

    @Property

    public long getLength() throws IOException {
        return Files.size(path);
    }

    @Property

    public boolean isFolder() {
        return Files.isDirectory(path);
    }

    @Property
    public Map<String, String> getMetaData() {
        return Map.of();
    }
}

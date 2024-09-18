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
package io.cloudbeaver.server.jetty;

import org.eclipse.jetty.server.AliasCheck;
import org.eclipse.jetty.util.resource.Resource;
import org.jkiss.code.NotNull;

import java.nio.file.Path;

public class CBSymLinkContentAllowedAliasChecker implements AliasCheck {
    @NotNull
    private final Path contentRootPath;

    public CBSymLinkContentAllowedAliasChecker(@NotNull Path contentRootPath) {
        this.contentRootPath = contentRootPath;
    }

    @Override
    public boolean checkAlias(String pathInContext, Resource resource) {
        Path resourcePath = resource.getPath();
        return resourcePath != null && resourcePath.startsWith(contentRootPath);
    }
}

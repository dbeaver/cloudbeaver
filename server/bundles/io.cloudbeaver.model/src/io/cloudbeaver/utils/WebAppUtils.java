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
package io.cloudbeaver.utils;

import io.cloudbeaver.model.app.WebApplication;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import java.nio.file.Path;

public class WebAppUtils {
    public static String getRelativePath(String path, String curDir) {
        return getRelativePath(path, Path.of(curDir));
    }

    public static String getRelativePath(String path, Path curDir) {
        if (path.startsWith("/") || path.length() > 2 && path.charAt(1) == ':') {
            return path;
        }
        return curDir.resolve(path).toAbsolutePath().toString();
    }

    public static WebApplication getWebApplication() {
        return (WebApplication) DBWorkbench.getPlatform().getApplication();
    }

}

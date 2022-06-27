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

import io.cloudbeaver.auth.NoAuthCredentialsProvider;
import io.cloudbeaver.model.app.WebApplication;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMAuthenticationManager;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import java.nio.file.Path;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

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

    public static SMAuthenticationManager getAuthManager(WebApplication application) throws DBException {
        var smController = application.getSecurityController(new NoAuthCredentialsProvider());
        if (!SMAuthenticationManager.class.isAssignableFrom(smController.getClass())) {
            throw new DBException("The current application cannot be used for authorization");
        }
        return (SMAuthenticationManager) smController;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> mergeConfigurations(Map<String, Object> origin, Map<String, Object> additional) {
        var resultConfig = new HashMap<String, Object>();
        Set<String> rootKeys = new HashSet<>(origin.keySet());
        rootKeys.addAll(additional.keySet());

        for (var rootKey : rootKeys) {
            var originValue = origin.get(rootKey);
            var additionalValue = additional.get(rootKey);

            if (originValue == null || additionalValue == null) {
                var resultValue = originValue != null ? originValue : additionalValue;
                resultConfig.put(rootKey, resultValue);
                continue;
            }

            if (originValue instanceof Map) {
                var resultValue = mergeConfigurations((Map<String, Object>) originValue, (Map<String, Object>) additionalValue);
                resultConfig.put(rootKey, resultValue);
            } else {
                resultConfig.put(rootKey, additionalValue);
            }

        }

        return resultConfig;
    }

}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.model.utils;

import org.jkiss.code.NotNull;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Applies JSON Merge Patch semantics to maps representing JSON objects.
 */
public final class JSONMergePatch {
    private JSONMergePatch() {
    }

    @NotNull
    public static Map<String, Object> apply(
        @NotNull Map<String, Object> target,
        @NotNull Map<String, Object> patch
    ) {
        Map<String, Object> result = copyMap(target);
        applyPatch(result, patch);
        return result;
    }

    private static void applyPatch(
        @NotNull Map<String, Object> target,
        @NotNull Map<String, Object> patch
    ) {
        for (Map.Entry<String, Object> entry : patch.entrySet()) {
            String key = entry.getKey();
            Object patchValue = entry.getValue();
            if (patchValue == null) {
                target.remove(key);
            } else if (patchValue instanceof Map<?, ?> patchMap) {
                Map<String, Object> targetMap;
                Object targetValue = target.get(key);
                if (targetValue instanceof Map<?, ?> currentMap) {
                    targetMap = copyMap(currentMap);
                } else {
                    targetMap = new LinkedHashMap<>();
                }
                applyPatch(targetMap, copyMap(patchMap));
                target.put(key, targetMap);
            } else {
                target.put(key, copyValue(patchValue));
            }
        }
    }

    @NotNull
    private static Map<String, Object> copyMap(@NotNull Map<?, ?> source) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : source.entrySet()) {
            if (!(entry.getKey() instanceof String key)) {
                throw new IllegalArgumentException("JSON object key must be a string");
            }
            result.put(key, copyValue(entry.getValue()));
        }
        return result;
    }

    private static Object copyValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            return copyMap(map);
        }
        if (value instanceof List<?> list) {
            List<Object> result = new ArrayList<>(list.size());
            for (Object item : list) {
                result.add(copyValue(item));
            }
            return result;
        }
        return value;
    }
}

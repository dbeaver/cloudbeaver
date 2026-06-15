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
package io.cloudbeaver;

import com.google.gson.*;
import com.google.gson.reflect.TypeToken;

import java.io.Reader;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

public class ConfigGenerator {

    private static final Gson gson = new GsonBuilder()
        .setPrettyPrinting()
        .disableHtmlEscaping()
        .create();
    private static final String EMPTY_STRING = "''";


    public static void main(String[] args) throws Exception {
        String baseConfigPath = System.getProperty("config.base");
        if (baseConfigPath == null || baseConfigPath.isEmpty()) {
            URL resource = ConfigGenerator.class.getClassLoader().getResource("config/cloudbeaver-base.conf");
            if (resource == null) {
                System.out.println("Base config path is required");
                return;
            }
            baseConfigPath = resource.toURI().getPath();
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                // Fix for Windows in dev mode. Resource URI starts with / (e.g. /C:/some/folder)
                // And this breaks Java NIO
                if (baseConfigPath.startsWith("/")) {
                    baseConfigPath = baseConfigPath.substring(1);
                }
            }
        }
        String outputPath = System.getProperty("config.output");
        if (outputPath == null || outputPath.isEmpty()) {
            System.out.println("Output config path is required");
            return;
        }

        String configPatches = System.getProperty("config.patches");

        List<String> overrideConfigs = configPatches == null ? List.of() : Arrays.asList(configPatches.split(","));

        Map<String, Object> config = readConfigurationFile(baseConfigPath);
        System.out.println("Base config loaded");

        for (String overrideConfig : overrideConfigs) {
            if (Files.exists(Path.of(overrideConfig))) {
                System.out.println("Applying override config: " + overrideConfig);
            } else {
                System.out.println("Override config not found, skipping: " + overrideConfig);
                continue;
            }
            System.out.println("Processing override config: " + overrideConfig);
            Map<String, Object> overrideConfigMap = readConfigurationFile(overrideConfig);
            System.out.println("Override config loaded: " + overrideConfig);
            applyProductConfig(config, overrideConfigMap);
            System.out.println("Override config applied: " + overrideConfig);
        }

        Map<String, Object> finalMap = convertToOutputFormat(config);
        System.out.println("Config converted to output format");

        writeConfigurationFile(finalMap, outputPath);
        System.out.println("Config written to: " + outputPath);
    }

    private static Map<String, Object> readConfigurationFile(String filePath) throws Exception {
        Path path = Path.of(filePath);
        if (!Files.exists(path)) {
            throw new IllegalArgumentException("Configuration file not found: " + filePath);
        }

        try (Reader reader = Files.newBufferedReader(path)) {
            return gson.fromJson(reader, TypeToken.getParameterized(Map.class, String.class, Object.class).getType());
        }
    }

    private static void applyProductConfig(Map<String, Object> baseConfig, Map<String, Object> productConfig) {
        if (productConfig.containsKey("add")) {
            Map<String, Object> add = (Map<String, Object>) productConfig.get("add");
            deepMergeMap(baseConfig, add);
        }

        if (productConfig.containsKey("remove")) {
            Map<String, Object> remove = (Map<String, Object>) productConfig.get("remove");
            deepRemoveMap(baseConfig, remove);
        }
    }

    private static void deepMergeMap(Map<String, Object> target, Map<String, Object> source) {
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            Object sourceValue = entry.getValue();
            Object targetValue = target.get(entry.getKey());

            if (sourceValue instanceof Map && targetValue instanceof Map) {
                deepMergeMap((Map<String, Object>) targetValue, (Map<String, Object>) sourceValue);
            } else {
                target.put(entry.getKey(), sourceValue);
            }
        }
    }

    private static void deepRemoveMap(Map<String, Object> target, Map<String, Object> source) {
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            Object sourceValue = entry.getValue();
            Object targetValue = target.get(entry.getKey());

            if (sourceValue instanceof Map && targetValue instanceof Map) {
                deepRemoveMap((Map<String, Object>) targetValue, (Map<String, Object>) sourceValue);
            } else {
                target.remove(entry.getKey());
            }
        }
    }

    private static void writeConfigurationFile(Map<String, Object> map, String filePath) throws Exception {
        JsonElement tree = gson.toJsonTree(map);
        StringBuilder sb = new StringBuilder();
        writeElement(tree, sb, 0);
        Files.write(Path.of(filePath), sb.toString().getBytes());
    }

    private static void writeElement(JsonElement elem, StringBuilder sb, int count) {
        String indent = "    ";
        if (elem.isJsonObject()) {
            sb.append("{\n");
            JsonObject obj = elem.getAsJsonObject();
            var iterator = obj.entrySet().iterator();

            while (iterator.hasNext()) {
                var entry = iterator.next();
                sb.repeat(indent, count + 1).append(entry.getKey()).append(": ");
                writeElement(entry.getValue(), sb, count + 1);
                if (iterator.hasNext()) {
                    sb.append(",");
                }
                sb.append("\n");
            }
            sb.repeat(indent, count).append("}");

        } else if (elem.isJsonArray()) {
            sb.append("[\n");
            JsonArray array = elem.getAsJsonArray();
            for (int i = 0; i < array.size(); i++) {
                sb.repeat(indent, count + 1);
                writeElement(array.get(i), sb, count + 1);
                if (i < array.size() - 1) {
                    sb.append(",");
                }
                sb.append("\n");
            }
            sb.repeat(indent, count).append("]");

        } else {
            String valueStr = gson.toJson(elem).replace("\n", "\n" + indent);
            sb.append(valueStr);
        }
    }

    private static Map<String, Object> convertToOutputFormat(Map<String, Object> map) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            result.put(entry.getKey(), convertValue(entry.getValue()));
        }
        return result;
    }

    private static Object convertValue(Object value) {
        if (value instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) value;
            if (!map.isEmpty() && map.containsKey("value")) {
                if (map.containsKey("env")) {
                    String env = (String) map.get("env");
                    Object defValue = map.get("value");
                    return "${" + env + ":" + formatDefaultValue(defValue) + "}";
                } else {
                    return convertValue(map.get("value"));
                }
            }
            Map<String, Object> result = new LinkedHashMap<>();
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                result.put(entry.getKey(), convertValue(entry.getValue()));
            }
            return result;
        } else if (value instanceof List) {
            List<Object> list = (List<Object>) value;
            List<Object> result = new ArrayList<>();
            for (Object item : list) {
                result.add(convertValue(item));
            }
            return result;
        }
        return value;
    }

    private static String formatDefaultValue(Object value) {
        return switch (value) {
            case null -> EMPTY_STRING;
            case String str -> str.isEmpty() ? EMPTY_STRING : str;
            case Boolean b -> value.toString();
            case Number number -> {
                if (number instanceof Double || number instanceof Float) {
                    long longVal = number.longValue();
                    if (longVal == number.doubleValue()) {
                        yield String.valueOf(longVal);
                    }
                }
                yield number.toString();
            }
            // TODO: handle list elements if needed
            default -> value.toString();
        };
    }
}

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
package io.cloudbeaver.service.data.transfer.graphql.upload;

import jakarta.servlet.http.HttpServletRequest;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public class MultipartFileHandler {
    public static Map<String, byte[]> parseMultipartRequest(HttpServletRequest request) {
        Map<String, byte[]> fileMap = new HashMap<>();

        try {
            String boundary = request.getContentType().split("boundary=")[1];
            InputStream inputStream = request.getInputStream();
            byte[] bytes = inputStream.readAllBytes();
            String content = new String(bytes);

            String[] parts = content.split("--" + boundary);
            for (String part : parts) {
                if (part.contains("Content-Disposition: form-data; name=\"file\"")) {
                    String[] fileData = part.split("\r\n\r\n");
                    String fileName = fileData[0].split("filename=")[1].replaceAll("\"", "").trim();
                    byte[] fileBytes = fileData[1].getBytes();
                    fileMap.put(fileName, fileBytes);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return fileMap;
    }

    private static String getBoundary(String contentType) {
        return contentType.split("boundary=")[1];
    }

    private static String getFileName(String contentDisposition) {
        String[] elements = contentDisposition.split(";");
        for (String element : elements) {
            if (element.trim().startsWith("filename")) {
                return element.split("=")[1].replaceAll("\"", "").trim();
            }
        }
        return null;
    }
}

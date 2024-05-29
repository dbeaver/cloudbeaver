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
package io.cloudbeaver.server.servlets;

import com.google.gson.stream.JsonWriter;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.utils.WebAppUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.utils.GeneralUtils;

import java.io.IOException;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;

@WebServlet(urlPatterns = "/status")
public class CBStatusServlet extends DefaultServlet {

    private static final Log log = Log.getLog(CBStatusServlet.class);

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType(CBConstants.APPLICATION_JSON);
        response.setHeader("Access-Control-Allow-Origin", "*");
        Map<String, Object> infoMap = new LinkedHashMap<>();
        infoMap.put("health", "ok");
        infoMap.put("product.name", GeneralUtils.getProductName());
        infoMap.put("product.version", GeneralUtils.getProductVersion().toString());
        infoMap.put("server.start.timestamp",
            WebAppUtils.getWebApplication().getStartTime().toInstant(ZoneOffset.UTC).toEpochMilli()
        );
        try (JsonWriter writer = new JsonWriter(response.getWriter())) {
            JSONUtils.serializeMap(writer, infoMap);
        }
    }

}
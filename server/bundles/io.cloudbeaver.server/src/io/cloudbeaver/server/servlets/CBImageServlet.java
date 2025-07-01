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

import io.cloudbeaver.server.CBConstants;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.core.runtime.FileLocator;
import org.jkiss.dbeaver.Log;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.Locale;

public class CBImageServlet extends HttpServlet {

    private static final Log log = Log.getLog(CBImageServlet.class);

    public CBImageServlet() {

    }

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String iconId = request.getPathInfo();
        while (iconId.startsWith("/")) {
            iconId = iconId.substring(1);
        }
        if (CommonUtils.isEmpty(iconId)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Image ID missing");
            return;
        }
        if (!iconId.startsWith("platform:/plugin")) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Bad image ID");
            return;
        }
        int divPos = iconId.lastIndexOf(".");
        if (divPos == -1) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Bad image extension");
            return;
        }
        String iconPath = iconId.substring(0, divPos);
        String iconExt = iconId.substring(divPos + 1);
        try {
            String bigIconPath = iconPath + "@2x." + iconExt;
            URL iconURL = FileLocator.find(new URL(bigIconPath));
            if (iconURL == null) {
                iconURL = FileLocator.find(new URL(iconId));
            }
            if (iconURL == null && "png".equalsIgnoreCase(iconExt)) {
                //try to fall back to SVG
                iconURL = FileLocator.find(new URL(iconPath + ".svg"));
                iconExt = "svg";
            }
            if (iconURL == null) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Image not found");
                return;
            }

            String contentType = switch (iconExt.toLowerCase(Locale.ROOT)) {
                case "svg" -> "image/svg+xml";
                default -> "image/" + iconExt;
            };
            response.setContentType(contentType);
            setExpireTime(response); // 3 days
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            try (InputStream is = new BufferedInputStream(iconURL.openStream())) {
                IOUtils.copyStream(is, buffer);
            }
            response.setContentLength(buffer.size());
            response.getOutputStream().write(buffer.toByteArray());
        } catch (Exception e) {
            log.error(e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Error reading image " + iconId + ": " + e.getMessage());
            return;
        }
    }

    private void setExpireTime(HttpServletResponse response) {
        // Http 1.0 header, set a fix expires date.
        response.setDateHeader("Expires", System.currentTimeMillis() + CBConstants.STATIC_CACHE_SECONDS * 1000);
        // Http 1.1 header, set a time after now.
        response.setHeader("Cache-Control", "public, max-age=" + CBConstants.STATIC_CACHE_SECONDS);
    }


}
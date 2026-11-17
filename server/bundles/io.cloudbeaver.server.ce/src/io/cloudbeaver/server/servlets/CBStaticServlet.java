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
package io.cloudbeaver.server.servlets;

import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.registry.WebHandlerRegistry;
import io.cloudbeaver.registry.WebServletHandlerDescriptor;
import io.cloudbeaver.server.CBApplication;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.jetty.ee11.servlet.DefaultServlet;
import org.eclipse.jetty.http.HttpHeader;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.utils.MimeTypes;
import org.jkiss.utils.IOUtils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@WebServlet(urlPatterns = "/")
public class CBStaticServlet extends DefaultServlet {
    private static final Log log = Log.getLog(CBStaticServlet.class);

    @NotNull
    private final Path contentRoot;

    public CBStaticServlet(@NotNull Path contentRoot) {
        this.contentRoot = contentRoot;
    }

    @Override
    protected void doGet(
        @NotNull HttpServletRequest request,
        @NotNull HttpServletResponse response
    ) throws ServletException, IOException {
        for (WebServletHandlerDescriptor handler : WebHandlerRegistry.getInstance().getServletHandlers()) {
            try {
                if (handler.getInstance().handleRequest(this, request, response)) {
                    return;
                }
            } catch (DBException e) {
                log.warn("Servlet handler '" + handler.getId() + "' failed", e);
            }
        }
        patchStaticContentIfNeeded(request, response);
    }

    private void patchStaticContentIfNeeded(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String pathInContext = request.getServletPath();

        if ("/".equals(pathInContext)) {
            pathInContext = "index.html";
        }

        if (pathInContext == null || !pathInContext.endsWith("index.html")
            && !pathInContext.endsWith("sso.html")
            && !pathInContext.endsWith("ssoError.html")
        ) {
            super.doGet(request, response);
            return;
        }

        if (pathInContext.startsWith("/")) {
            pathInContext = pathInContext.substring(1);
        }
        Path filePath = contentRoot.resolve(pathInContext).normalize();
        if (!filePath.startsWith(contentRoot)) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (InputStream fis = Files.newInputStream(filePath)) {
            IOUtils.copyStream(fis, baos);
        }
        String indexContents = baos.toString(StandardCharsets.UTF_8);
        CBServerConfig serverConfig = CBApplication.getInstance().getServerConfiguration();
        indexContents = indexContents
            .replace("{ROOT_URI}", serverConfig.getRootURI())
            .replace("{STATIC_CONTENT}", serverConfig.getStaticContent());
        byte[] indexBytes = indexContents.getBytes(StandardCharsets.UTF_8);

        // Disable cache for index.html
        response.setHeader(HttpHeader.CACHE_CONTROL.toString(), "no-cache, no-store, must-revalidate");
        response.setHeader(HttpHeader.CONTENT_TYPE.toString(), MimeTypes.TEXT_HTML);
        response.setHeader(HttpHeader.EXPIRES.toString(), "0");
        response.getOutputStream().write(indexBytes);
    }

}

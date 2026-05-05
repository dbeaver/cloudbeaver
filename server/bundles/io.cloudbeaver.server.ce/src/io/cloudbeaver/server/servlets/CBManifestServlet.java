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

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.server.CBApplication;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.jetty.http.HttpHeader;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.utils.MimeTypes;
import org.jkiss.utils.IOUtils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@WebServlet(urlPatterns = "/manifest.webmanifest")
public class CBManifestServlet extends HttpServlet {

    private static final Log log = Log.getLog(CBManifestServlet.class);
    private static final String MANIFEST_FILE = "manifest.webmanifest";
    
    // Fix: Create Gson instance with HTML escaping disabled to prevent \u003d escaping
    private static final Gson GSON = new GsonBuilder()
            .setPrettyPrinting()
            .disableHtmlEscaping()  // This prevents escaping = to \u003d
            .create();

    @NotNull
    private final Path contentRoot;

    public CBManifestServlet(@NotNull Path contentRoot) {
        this.contentRoot = contentRoot;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        Path manifestPath = contentRoot.resolve(MANIFEST_FILE).normalize();
        
        if (!manifestPath.startsWith(contentRoot) || !Files.exists(manifestPath)) {
            log.error("Manifest file not found or path is invalid: " + manifestPath);
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        try {
            // Read the original manifest file
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (InputStream fis = Files.newInputStream(manifestPath)) {
                IOUtils.copyStream(fis, baos);
            }
            String manifestContent = baos.toString(StandardCharsets.UTF_8);

            // Parse the JSON and update dynamic fields
            CBServerConfig serverConfig = CBApplication.getInstance().getServerConfiguration();
            String rootURI = serverConfig.getRootURI();
            
            // Ensure rootURI ends with / for proper scope and path handling
            String normalizedRootURI = rootURI;
            if (!normalizedRootURI.endsWith("/")) {
                normalizedRootURI += "/";
            }

            // Use JsonParser to parse the existing manifest
            JsonObject manifest = JsonParser.parseString(manifestContent).getAsJsonObject();
            
            // Update scope to match the rootURI
            manifest.addProperty("scope", normalizedRootURI);
            
            // Update start_url and id to match the rootURI
            String startUrl = normalizedRootURI + "?source=pwa";
            manifest.addProperty("start_url", startUrl);
            manifest.addProperty("id", startUrl);

            // Convert back to JSON string using the Gson instance with HTML escaping disabled
            String updatedManifest = GSON.toJson(manifest);
            byte[] manifestBytes = updatedManifest.getBytes(StandardCharsets.UTF_8);

            // Set appropriate headers
            response.setHeader(HttpHeader.CONTENT_TYPE.toString(), "application/manifest+json");
            response.setHeader(HttpHeader.CACHE_CONTROL.toString(), "no-cache, no-store, must-revalidate");
            response.setHeader(HttpHeader.EXPIRES.toString(), "0");
            response.setContentLength(manifestBytes.length);
            
            // Write the response
            response.getOutputStream().write(manifestBytes);
            
        } catch (Exception e) {
            log.error("Error processing manifest file", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
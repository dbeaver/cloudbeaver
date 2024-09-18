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

import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.server.CBApplication;
import org.eclipse.jetty.http.HttpHeader;
import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.Response;
import org.eclipse.jetty.util.Callback;
import org.jkiss.code.NotNull;
import org.jkiss.utils.IOUtils;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class ProxyResourceHandler extends Handler.Wrapper {
    @NotNull
    private final Path contentRoot;

    public ProxyResourceHandler(@NotNull Path contentRoot) {
        this.contentRoot = contentRoot;
    }

    public boolean handle(Request request, Response response, Callback callback) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        String pathInContext = Request.getPathInContext(request);

        if ("/".equals(pathInContext)) {
            pathInContext = "index.html";
        }

        if (pathInContext == null || !pathInContext.endsWith("index.html")
            && !pathInContext.endsWith("sso.html")
            && !pathInContext.endsWith("ssoError.html")
        ) {
            return super.handle(request, response, callback);
        }

        if (pathInContext.startsWith("/")) {
            pathInContext = pathInContext.substring(1);
        }
        var filePath = contentRoot.resolve(pathInContext);
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
        response.getHeaders().put(HttpHeader.CACHE_CONTROL.toString(), "no-cache, no-store, must-revalidate");
        response.getHeaders().put(HttpHeader.EXPIRES.toString(), "0");

        response.write(true, ByteBuffer.wrap(indexBytes), callback);
        return true;
    }
}

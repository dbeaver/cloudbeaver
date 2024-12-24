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
package io.cloudbeaver.server.jetty;

import io.cloudbeaver.service.DBWWebSocketContext;
import jakarta.websocket.server.ServerEndpointConfig;
import org.eclipse.jetty.ee10.servlet.ServletContextHandler;
import org.eclipse.jetty.ee10.websocket.jakarta.server.config.JakartaWebSocketServletContainerInitializer;
import org.eclipse.jetty.server.Server;
import org.jkiss.code.NotNull;

import java.util.ArrayList;
import java.util.List;

public class CBJettyWebSocketContext implements DBWWebSocketContext {
    private final List<String> mappings = new ArrayList<>();

    private final Server server;
    private final ServletContextHandler servletContextHandler;

    public CBJettyWebSocketContext(@NotNull Server server, @NotNull ServletContextHandler servletContextHandler) {
        this.server = server;
        this.servletContextHandler = servletContextHandler;
    }


    @Override
    public void addWebSocket(@NotNull ServerEndpointConfig endpointConfig) {
        // Add jakarta.websocket support
        JakartaWebSocketServletContainerInitializer.configure(servletContextHandler, (context, container) -> {
            container.addEndpoint(endpointConfig);
            this.mappings.add(endpointConfig.getPath());
        });
    }

    @NotNull
    public List<String> getMappings() {
        return mappings;
    }
}

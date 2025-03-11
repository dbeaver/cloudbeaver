/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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

import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import io.cloudbeaver.server.filters.ServerConfigurationTimeLimitFilter;
import io.cloudbeaver.server.servlets.CBImageServlet;
import io.cloudbeaver.server.servlets.CBStaticServlet;
import io.cloudbeaver.server.servlets.WebStatusServlet;
import io.cloudbeaver.server.websockets.CBEventsWebSocket;
import io.cloudbeaver.server.websockets.CBWebSocketServerConfigurator;
import io.cloudbeaver.service.DBWServiceBindingServlet;
import io.cloudbeaver.service.DBWServiceBindingWebSocket;
import jakarta.websocket.server.ServerEndpointConfig;
import org.eclipse.jetty.ee10.servlet.ErrorPageErrorHandler;
import org.eclipse.jetty.ee10.servlet.ServletContextHandler;
import org.eclipse.jetty.ee10.servlet.ServletHolder;
import org.eclipse.jetty.ee10.servlet.ServletMapping;
import org.eclipse.jetty.ee10.websocket.jakarta.server.config.JakartaWebSocketServletContainerInitializer;
import org.eclipse.jetty.server.*;
import org.eclipse.jetty.util.resource.ResourceFactory;
import org.eclipse.jetty.xml.XmlConfiguration;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.utils.CommonUtils;

import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

public class CBJettyServer {

    private static final Log log = Log.getLog(CBJettyServer.class);
    static {
        // Set Jetty log level to WARN
        System.setProperty("org.eclipse.jetty.util.log.class", "org.eclipse.jetty.util.log.StdErrLog");
        System.setProperty("org.eclipse.jetty.LEVEL", "WARN");
    }

    private final CBApplication<?> application;
    private Server server;

    public CBJettyServer(@NotNull CBApplication<?> application) {
        this.application = application;
    }

    public void runServer() {
        try {
            CBServerConfig serverConfiguration = application.getServerConfiguration();
            int serverPort = serverConfiguration.getServerPort();
            String serverHost = serverConfiguration.getServerHost();
            Path sslPath = getSslConfigurationPath();

            boolean sslConfigurationExists = sslPath != null && Files.exists(sslPath);
            if (sslConfigurationExists) {
                server = new Server();
                XmlConfiguration sslConfiguration = new XmlConfiguration(ResourceFactory.of(server).newResource(sslPath));
                ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
                // method sslConfiguration.configure() does not see the context class of the Loader,
                // so we have to configure it manually, then return the old classLoader.
                Thread.currentThread().setContextClassLoader(this.getClass().getClassLoader());
                sslConfiguration.configure(server);
                Thread.currentThread().setContextClassLoader(classLoader);
            } else {
                if (CommonUtils.isEmpty(serverHost)) {
                    server = new Server(serverPort);
                } else {
                    server = new Server(
                        InetSocketAddress.createUnresolved(serverHost, serverPort));
                }
            }

            {
                // Handler configuration
                Path contentRootPath = Path.of(serverConfiguration.getContentRoot());
                ServletContextHandler servletContextHandler = new ServletContextHandler(ServletContextHandler.SESSIONS);
                servletContextHandler.setBaseResourceAsPath(contentRootPath);
                String rootURI = serverConfiguration.getRootURI();
                servletContextHandler.setContextPath(rootURI);

                ServletHolder staticServletHolder = new ServletHolder(
                    "static", new CBStaticServlet(Path.of(serverConfiguration.getContentRoot()))
                );
                staticServletHolder.setInitParameter("dirAllowed", "false");
                staticServletHolder.setInitParameter("cacheControl",
                    "public, max-age=" + CBConstants.STATIC_CACHE_SECONDS);
                servletContextHandler.addServlet(staticServletHolder, "/");

                if (Files.isSymbolicLink(contentRootPath)) {
                    servletContextHandler.addAliasCheck(new CBSymLinkContentAllowedAliasChecker(contentRootPath));
                }

                ServletHolder imagesServletHolder = new ServletHolder("images", new CBImageServlet());
                servletContextHandler.addServlet(imagesServletHolder, serverConfiguration.getServicesURI() + "images/*");

                servletContextHandler.addServlet(new ServletHolder("status", new WebStatusServlet()), "/status");

                servletContextHandler.addServlet(
                    new ServletHolder(
                        "graphql",
                        new GraphQLEndpoint(new ServerConfigurationTimeLimitFilter(application))
                    ),
                    serverConfiguration.getServicesURI() + "gql/*"
                );
                servletContextHandler.addEventListener(new CBServerContextListener(application));

                // Add extensions from services

                CBJettyServletContext servletContext = new CBJettyServletContext(servletContextHandler);
                for (DBWServiceBindingServlet wsd : WebServiceRegistry.getInstance()
                    .getWebServices(DBWServiceBindingServlet.class)
                ) {
                    if (wsd.isApplicable(this.application)) {
                        try {
                            wsd.addServlets(this.application, servletContext);
                        } catch (DBException e) {
                            log.error(e.getMessage(), e);
                        }
                    }
                }

                CBJettyWebSocketContext webSocketContext = new CBJettyWebSocketContext(server, servletContextHandler);
                for (DBWServiceBindingWebSocket wsb : WebServiceRegistry.getInstance()
                    .getWebServices(DBWServiceBindingWebSocket.class)
                ) {
                    if (wsb.isApplicable(this.application)) {
                        try {
                            wsb.addWebSockets(this.application, webSocketContext);
                        } catch (DBException e) {
                            log.error(e.getMessage(), e);
                        }
                    }
                }

                JakartaWebSocketServletContainerInitializer.configure(servletContextHandler, (context, container) -> {
                    // Add echo endpoint to server container
                    ServerEndpointConfig eventWsEnpoint = ServerEndpointConfig.Builder
                        .create(
                            CBEventsWebSocket.class,
                            serverConfiguration.getServicesURI() + "ws"
                        ).configurator(new CBWebSocketServerConfigurator(application.getSessionManager()))
                        .build();
                    container.addEndpoint(eventWsEnpoint);
                });

                JettyUtils.initSessionManager(
                    this.application.getMaxSessionIdleTime(),
                    this.application,
                    server,
                    servletContextHandler
                );

                server.setHandler(servletContextHandler);

                ErrorPageErrorHandler errorHandler = new ErrorPageErrorHandler();
                //errorHandler.addErrorPage(404, "/missing.html");
                servletContextHandler.setErrorHandler(errorHandler);

                log.debug("Active servlets:"); //$NON-NLS-1$
                for (ServletMapping sm : servletContextHandler.getServletHandler().getServletMappings()) {
                    log.debug("\t" + sm.getServletName() + ": " + Arrays.toString(sm.getPathSpecs())); //$NON-NLS-1$
                }

                log.debug("Active websocket mappings:");
                for (String mapping : webSocketContext.getMappings()) {
                    log.debug("\t" + mapping);
                }

            }

            boolean forwardProxy = application.getAppConfiguration().isEnabledForwardProxy();
            {
                // HTTP config
                for(Connector y : server.getConnectors()) {
                    for(ConnectionFactory x  : y.getConnectionFactories()) {
                        if(x instanceof HttpConnectionFactory) {
                            HttpConfiguration httpConfiguration = ((HttpConnectionFactory)x).getHttpConfiguration();
                            httpConfiguration.setSendServerVersion(false);
                            if (forwardProxy) {
                                httpConfiguration.addCustomizer(new ForwardedRequestCustomizer());
                            }
                        }
                    }
                }
            }
            refreshJettyConfig();
            server.start();
            server.join();
        } catch (Exception e) {
            log.error("Error running Jetty server", e);
        }
    }

    @Nullable
    private Path getSslConfigurationPath() {
        var sslConfigurationPath = application.getServerConfiguration().getSslConfigurationPath();
        if (sslConfigurationPath == null) {
            return null;
        }
        var sslConfiguration = Path.of(sslConfigurationPath);
        return sslConfiguration.isAbsolute() ? sslConfiguration : application.getHomeDirectory().resolve(sslConfiguration);
    }

    public synchronized void refreshJettyConfig() {
        if (server == null) {
            return;
        }
        log.info("Refreshing Jetty configuration");
        if (server.getHandler() instanceof ServletContextHandler servletContextHandler
            && servletContextHandler.getSessionHandler() instanceof CBSessionHandler cbSessionHandler
        ) {
            cbSessionHandler.setMaxCookieAge((int) (application.getMaxSessionIdleTime() / 1000));
            var serverUrl = this.application.getServerURL();
            cbSessionHandler.setSecureCookies(serverUrl != null && serverUrl.startsWith("https://"));
        }
    }
}
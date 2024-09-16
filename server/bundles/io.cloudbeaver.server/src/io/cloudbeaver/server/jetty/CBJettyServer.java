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

import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import io.cloudbeaver.server.servlets.CBImageServlet;
import io.cloudbeaver.server.servlets.CBStaticServlet;
import io.cloudbeaver.server.servlets.CBStatusServlet;
import io.cloudbeaver.server.websockets.CBJettyWebSocketManager;
import io.cloudbeaver.service.DBWServiceBindingServlet;
import org.eclipse.jetty.server.*;
import org.eclipse.jetty.server.session.DefaultSessionCache;
import org.eclipse.jetty.server.session.DefaultSessionIdManager;
import org.eclipse.jetty.server.session.NullSessionDataStore;
import org.eclipse.jetty.servlet.ErrorPageErrorHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.servlet.ServletMapping;
import org.eclipse.jetty.util.resource.PathResource;
import org.eclipse.jetty.websocket.server.config.JettyWebSocketServletContainerInitializer;
import org.eclipse.jetty.xml.XmlConfiguration;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.utils.CommonUtils;

import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;

public class CBJettyServer {

    private static final Log log = Log.getLog(CBJettyServer.class);
    static {
        // Set Jetty log level to WARN
        System.setProperty("org.eclipse.jetty.util.log.class", "org.eclipse.jetty.util.log.StdErrLog");
        System.setProperty("org.eclipse.jetty.LEVEL", "WARN");
    }

    private final CBApplication<?> application;

    public CBJettyServer(@NotNull CBApplication<?> application) {
        this.application = application;
    }

    public void runServer() {
        try {
            CBServerConfig serverConfiguration = application.getServerConfiguration();
            JettyServer server;
            int serverPort = serverConfiguration.getServerPort();
            String serverHost = serverConfiguration.getServerHost();
            Path sslPath = getSslConfigurationPath();

            boolean sslConfigurationExists = sslPath != null && Files.exists(sslPath);
            if (sslConfigurationExists) {
                server = new JettyServer();
                XmlConfiguration sslConfiguration = new XmlConfiguration(new PathResource(sslPath));
                ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
                // method sslConfiguration.configure() does not see the context class of the Loader,
                // so we have to configure it manually, then return the old classLoader.
                Thread.currentThread().setContextClassLoader(this.getClass().getClassLoader());
                sslConfiguration.configure(server);
                Thread.currentThread().setContextClassLoader(classLoader);
            } else {
                if (CommonUtils.isEmpty(serverHost)) {
                    server = new JettyServer(serverPort);
                } else {
                    server = new JettyServer(
                        InetSocketAddress.createUnresolved(serverHost, serverPort));
                }
            }

            {
                // Handler configuration
                ServletContextHandler servletContextHandler = new ServletContextHandler(ServletContextHandler.SESSIONS);
                servletContextHandler.setResourceBase(serverConfiguration.getContentRoot());
                String rootURI = serverConfiguration.getRootURI();
                servletContextHandler.setContextPath(rootURI);

                ServletHolder staticServletHolder = new ServletHolder("static", new CBStaticServlet());
                staticServletHolder.setInitParameter("dirAllowed", "false");
                servletContextHandler.addServlet(staticServletHolder, "/*");

                ServletHolder imagesServletHolder = new ServletHolder("images", new CBImageServlet());
                servletContextHandler.addServlet(imagesServletHolder, serverConfiguration.getServicesURI() + "images/*");

                servletContextHandler.addServlet(new ServletHolder("status", new CBStatusServlet()), "/status");

                servletContextHandler.addServlet(new ServletHolder("graphql", new GraphQLEndpoint()), serverConfiguration.getServicesURI() + "gql/*");
                servletContextHandler.addEventListener(new CBServerContextListener(application));

                // Add extensions from services

                CBJettyServletContext servletContext = new CBJettyServletContext(servletContextHandler);
                for (DBWServiceBindingServlet wsd : WebServiceRegistry.getInstance().getWebServices(DBWServiceBindingServlet.class)) {
                    try {
                        wsd.addServlets(this.application, servletContext);
                    } catch (DBException e) {
                        log.error(e.getMessage(), e);
                    }
                }

                initSessionManager(this.application, servletContextHandler);

                server.setHandler(servletContextHandler);

                JettyWebSocketServletContainerInitializer.configure(servletContextHandler,
                    (context, wsContainer) -> {
                        wsContainer.setIdleTimeout(Duration.ofMinutes(5));
                        // Add websockets
                        wsContainer.addMapping(
                            serverConfiguration.getServicesURI() + "ws/*",
                            new CBJettyWebSocketManager(this.application.getSessionManager())
                        );
                    }
                );
                ErrorPageErrorHandler errorHandler = new ErrorPageErrorHandler();
                //errorHandler.addErrorPage(404, "/missing.html");
                servletContextHandler.setErrorHandler(errorHandler);

                log.debug("Active servlets:"); //$NON-NLS-1$
                for (ServletMapping sm : servletContextHandler.getServletHandler().getServletMappings()) {
                    log.debug("\t" + sm.getServletName() + ": " + Arrays.toString(sm.getPathSpecs())); //$NON-NLS-1$
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

    private void initSessionManager(
        @NotNull CBApplication<?> application,
        @NotNull ServletContextHandler servletContextHandler
    ) {
        // Init sessions persistence
        CBSessionHandler sessionHandler = new CBSessionHandler(application);
        var maxIdleTime = application.getMaxSessionIdleTime();
        int intMaxIdleSeconds;
        if (maxIdleTime > Integer.MAX_VALUE) {
            log.warn("Max session idle time value is greater than Integer.MAX_VALUE. Integer.MAX_VALUE will be used instead");
            maxIdleTime = Integer.MAX_VALUE;
        }
        intMaxIdleSeconds = (int) (maxIdleTime / 1000);
        log.debug("Max http session idle time: " + intMaxIdleSeconds + "s");
        sessionHandler.setMaxInactiveInterval(intMaxIdleSeconds);

        DefaultSessionCache sessionCache = new DefaultSessionCache(sessionHandler);
        sessionCache.setSessionDataStore(new NullSessionDataStore());
        sessionHandler.setSessionCache(sessionCache);
        servletContextHandler.setSessionHandler(sessionHandler);
    }

    public static class JettyServer extends Server {
        public JettyServer(int serverPort) {
            super(serverPort);
        }

        public JettyServer() {
            super();
        }
        public JettyServer(InetSocketAddress addr) {
            super(addr);
        }

        @Override
        public void setSessionIdManager(SessionIdManager sessionIdManager) {
            if (sessionIdManager instanceof DefaultSessionIdManager) {
                // Nullify worker name to avoid dummy prefixes in session ID cookie
                ((DefaultSessionIdManager) sessionIdManager).setWorkerName(null);
            }
            super.setSessionIdManager(sessionIdManager);
        }
    }
}
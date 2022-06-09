package io.cloudbeaver.server.jetty;

import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import io.cloudbeaver.server.servlets.CBImageServlet;
import io.cloudbeaver.server.servlets.CBStaticServlet;
import io.cloudbeaver.server.servlets.CBStatusServlet;
import io.cloudbeaver.service.DBWServiceBindingServlet;
import org.eclipse.jetty.server.*;
import org.eclipse.jetty.server.session.DefaultSessionCache;
import org.eclipse.jetty.server.session.DefaultSessionIdManager;
import org.eclipse.jetty.server.session.FileSessionDataStore;
import org.eclipse.jetty.server.session.SessionHandler;
import org.eclipse.jetty.servlet.ErrorPageErrorHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.servlet.ServletMapping;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

public class CBJettyServer {

    private static final Log log = Log.getLog(CBJettyServer.class);
    private static final String SESSION_CACHE_DIR = ".http-sessions";

    static {
        // Set Jetty log level to WARN
        System.setProperty("org.eclipse.jetty.util.log.class", "org.eclipse.jetty.util.log.StdErrLog");
        System.setProperty("org.eclipse.jetty.LEVEL", "WARN");
    }

    public CBJettyServer() {
    }

    public void runServer() {
        CBApplication application = CBApplication.getInstance();
        try {
            JettyServer server;
            int serverPort = application.getServerPort();
            String serverHost = application.getServerHost();
            if (CommonUtils.isEmpty(serverHost)) {
                server = new JettyServer(serverPort);
            } else {
                server = new JettyServer(
                    InetSocketAddress.createUnresolved(serverHost, serverPort));
            }

            {
                // Handler configuration
                ServletContextHandler servletContextHandler = new ServletContextHandler(ServletContextHandler.SESSIONS);
                servletContextHandler.setResourceBase(application.getContentRoot());
                String rootURI = application.getRootURI();
                servletContextHandler.setContextPath(rootURI);

                ServletHolder staticServletHolder = new ServletHolder("static", new CBStaticServlet());
                staticServletHolder.setInitParameter("dirAllowed", "false");
                servletContextHandler.addServlet(staticServletHolder, "/*");

                ServletHolder imagesServletHolder = new ServletHolder("images", new CBImageServlet());
                servletContextHandler.addServlet(imagesServletHolder, application.getServicesURI() + "images/*");

                servletContextHandler.addServlet(new ServletHolder("status", new CBStatusServlet()), "/status");

                servletContextHandler.addServlet(new ServletHolder("graphql", new GraphQLEndpoint()), application.getServicesURI() + "gql/*");
                servletContextHandler.addEventListener(new CBServerContextListener());

                // Add extensions from services
                for (DBWServiceBindingServlet wsd : WebServiceRegistry.getInstance().getWebServices(DBWServiceBindingServlet.class)) {
                    wsd.addServlets(application, servletContextHandler);
                }

                initSessionManager(server, servletContextHandler);

                server.setHandler(servletContextHandler);

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

    private void initSessionManager(Server server, ServletContextHandler servletContextHandler) {
        // Init sessions persistence
        Path metadataFolder = GeneralUtils.getMetadataFolder(DBWorkbench.getPlatform().getWorkspace().getAbsolutePath());
        Path sessionCacheFolder = metadataFolder.resolve(SESSION_CACHE_DIR);
        if (!Files.exists(sessionCacheFolder)) {
            try {
                Files.createDirectories(sessionCacheFolder);
            } catch (IOException e) {
                log.error("Can't create http session cache directory '" + sessionCacheFolder.toAbsolutePath() + "'", e);
                return;
            }
        }

        SessionHandler sessionHandler = new SessionHandler()/* {
            public HttpCookie access(HttpSession session, boolean secure) {
                HttpCookie cookie = getSessionCookie(session, _context == null ? "/" : (_context.getContextPath()), secure);
                return cookie;
            }

            @Override
            public int getRefreshCookieAge() {
                // Refresh cookie always (we need it for FA requests)
                return 1;
            }
        }*/;
        DefaultSessionCache sessionCache = new DefaultSessionCache(sessionHandler);
        FileSessionDataStore sessionStore = new FileSessionDataStore();

        sessionStore.setStoreDir(sessionCacheFolder.toFile());
        sessionCache.setSessionDataStore(sessionStore);
        sessionHandler.setSessionCache(sessionCache);
        servletContextHandler.setSessionHandler(sessionHandler);
    }

    private static class JettyServer extends Server {
        public JettyServer(int serverPort) {
            super(serverPort);
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
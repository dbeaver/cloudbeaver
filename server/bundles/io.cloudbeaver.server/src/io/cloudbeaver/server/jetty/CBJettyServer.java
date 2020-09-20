package io.cloudbeaver.server.jetty;

import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import io.cloudbeaver.service.DBWServiceBindingServlet;
import org.eclipse.jetty.server.ConnectionFactory;
import org.eclipse.jetty.server.Connector;
import org.eclipse.jetty.server.HttpConnectionFactory;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.session.DefaultSessionCache;
import org.eclipse.jetty.server.session.FileSessionDataStore;
import org.eclipse.jetty.server.session.SessionHandler;
import org.eclipse.jetty.servlet.ErrorPageErrorHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.servlet.ServletMapping;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;

import java.io.File;
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
            Server server = new Server(application.getServerPort());

            {
                // Handler configuration
                ServletContextHandler servletContextHandler = new ServletContextHandler(ServletContextHandler.SESSIONS);
                servletContextHandler.setResourceBase(application.getContentRoot());
                servletContextHandler.setContextPath(application.getRootURI());
                servletContextHandler.addServlet(new ServletHolder("static", new CBStaticServlet()), application.getRootURI());
                servletContextHandler.addServlet(new ServletHolder("images", new CBImageServlet()), application.getServicesURI() + "images/*");
                servletContextHandler.addServlet(new ServletHolder("graphql", new GraphQLEndpoint()), application.getServicesURI() + "gql/*");
                servletContextHandler.addEventListener(new CBServerContextListener());

                // Add extensions from services
                for (DBWServiceBindingServlet wsd : WebServiceRegistry.getInstance().getWebServices(DBWServiceBindingServlet.class)) {
                    wsd.addServlets(application, servletContextHandler);
                }

                initSessionManager(servletContextHandler);

                server.setHandler(servletContextHandler);

                ErrorPageErrorHandler errorHandler = new ErrorPageErrorHandler();
                //errorHandler.addErrorPage(404, "/missing.html");
                servletContextHandler.setErrorHandler(errorHandler);

                log.debug("Active servlets:"); //$NON-NLS-1$
                for (ServletMapping sm : servletContextHandler.getServletHandler().getServletMappings()) {
                    log.debug("\t" + sm.getServletName() + ": " + Arrays.toString(sm.getPathSpecs())); //$NON-NLS-1$
                }

            }

            {
                // HTTP config
                for(Connector y : server.getConnectors()) {
                    for(ConnectionFactory x  : y.getConnectionFactories()) {
                        if(x instanceof HttpConnectionFactory) {
                            ((HttpConnectionFactory)x).getHttpConfiguration().setSendServerVersion(false);
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

    private void initSessionManager(ServletContextHandler servletContextHandler) {
        // Init sessions persistence
        File metadataFolder = GeneralUtils.getMetadataFolder(DBWorkbench.getPlatform().getWorkspace().getAbsolutePath());
        File sessionCacheFolder = new File(metadataFolder, SESSION_CACHE_DIR);
        if (!sessionCacheFolder.exists()) {
            if (!sessionCacheFolder.mkdirs()) {
                log.error("Can't create http session cache directory '" + sessionCacheFolder.getAbsolutePath() + "'");
                return;
            }
        }

        SessionHandler sessionHandler = new SessionHandler();
        DefaultSessionCache sessionCache = new DefaultSessionCache(sessionHandler);
        FileSessionDataStore sessionStore = new FileSessionDataStore();

        sessionStore.setStoreDir(sessionCacheFolder);
        sessionCache.setSessionDataStore(sessionStore);
        sessionHandler.setSessionCache(sessionCache);
        servletContextHandler.setSessionHandler(sessionHandler);
    }

}
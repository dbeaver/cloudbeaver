package io.cloudbeaver.server.jetty;

import io.cloudbeaver.server.CloudbeaverApplication;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import org.eclipse.jetty.server.ConnectionFactory;
import org.eclipse.jetty.server.Connector;
import org.eclipse.jetty.server.HttpConnectionFactory;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.session.DefaultSessionCache;
import org.eclipse.jetty.server.session.FileSessionDataStore;
import org.eclipse.jetty.server.session.SessionHandler;
import org.eclipse.jetty.servlet.ErrorPageErrorHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;

import java.io.File;

public class CloudbeaverJettyServer {

    private static final Log log = Log.getLog(CloudbeaverJettyServer.class);
    private static final String SESSION_CACHE_DIR = ".http-sessions";

    public CloudbeaverJettyServer() {
    }

    public void runServer() {
        CloudbeaverApplication application = CloudbeaverApplication.getInstance();
        try {
            Server server = new Server(application.getServerPort());

            {
                // Handler configuration
                ServletContextHandler servletContextHandler = new ServletContextHandler(ServletContextHandler.SESSIONS);
                servletContextHandler.setResourceBase(application.getContentRoot());
                servletContextHandler.setContextPath(application.getRootURI());
                servletContextHandler.addServlet(CloudbeaverStaticServlet.class, application.getRootURI());
                servletContextHandler.addServlet(CloudbeaverImageServlet.class, application.getServicesURI() + "images/*");
                servletContextHandler.addServlet(GraphQLEndpoint.class, application.getServicesURI() + "gql/*");
                servletContextHandler.addEventListener(new CloudbeaverServerContextListener());
                initSessionManager(servletContextHandler);

                server.setHandler(servletContextHandler);

                ErrorPageErrorHandler errorHandler = new ErrorPageErrorHandler();
                //errorHandler.addErrorPage(404, "/missing.html");
                servletContextHandler.setErrorHandler(errorHandler);
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
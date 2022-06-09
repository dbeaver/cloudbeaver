package io.cloudbeaver.server.servlets;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.auth.SMWAuthProviderFederated;
import io.cloudbeaver.auth.provider.AuthProviderConfig;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebHandlerRegistry;
import io.cloudbeaver.registry.WebServletHandlerDescriptor;
import io.cloudbeaver.server.CBAppConfig;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import org.eclipse.jetty.http.HttpContent;
import org.eclipse.jetty.http.HttpField;
import org.eclipse.jetty.http.HttpHeader;
import org.eclipse.jetty.server.ResourceService;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.util.resource.Resource;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Map;

@WebServlet(urlPatterns = "/")
public class CBStaticServlet extends DefaultServlet {

    public static final int STATIC_CACHE_SECONDS = 60 * 60 * 24 * 3;

    private static final Log log = Log.getLog(CBStaticServlet.class);

    public CBStaticServlet() {
        super(makeResourceService());
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        for (WebServletHandlerDescriptor handler : WebHandlerRegistry.getInstance().getServletHandlers()) {
            try {
                if (handler.getInstance().handleRequest(this, request, response)) {
                    return;
                }
            } catch (DBException e) {
                log.warn("Servlet handler '" + handler.getId() + "' failed", e);
            }
        }
        String uri = request.getPathInfo();

        if (CBApplication.getInstance().getAppConfiguration().isRedirectOnFederatedAuth() &&
            (CommonUtils.isEmpty(uri) || uri.equals("/") || uri.equals("/index.html")) &&
            request.getParameterMap().isEmpty()) {
            if (processSessionStart(request, response)) {
                return;
            }
        }

        super.doGet(request, response);
    }

    private boolean processSessionStart(HttpServletRequest request, HttpServletResponse response) {
        CBApplication application = CBApplication.getInstance();
        if (application.isConfigurationMode()) {
            return false;
        }
        CBAppConfig appConfig = application.getAppConfiguration();
        String[] authProviders = appConfig.getEnabledAuthProviders();
        if (authProviders.length == 1) {
            String authProviderId = authProviders[0];
            AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(authProviderId);
            if (authProvider != null && authProvider.isConfigurable()) {
                String configId = null;
                AuthProviderConfig activeAuthConfig = null;
                for (Map.Entry<String, AuthProviderConfig> cfg : appConfig.getAuthProviderConfigurations().entrySet()) {
                    if (!cfg.getValue().isDisabled() && cfg.getValue().getProvider().equals(authProviderId)) {
                        if (activeAuthConfig != null) {
                            return false;
                        }
                        configId = cfg.getKey();
                        activeAuthConfig = cfg.getValue();
                    }
                }
                if (activeAuthConfig == null) {
                    return false;
                }

                try {
                    // We have the only provider
                    // Forward to signon URL
                    SMAuthProvider<?> authProviderInstance = authProvider.getInstance();
                    if (authProviderInstance instanceof SMWAuthProviderFederated) {
                        WebSession webSession = CBPlatform.getInstance().getSessionManager().getWebSession(request, response, false);
                        if (webSession.getUser() == null) {
                            String signInLink = ((SMWAuthProviderFederated) authProviderInstance).getSignInLink(configId, Collections.emptyMap());
                            //ignore current routing if non-root page is open
                            if (!signInLink.endsWith("#")) {
                                signInLink += "#";
                            }
                            if (!CommonUtils.isEmpty(signInLink)) {
                                // Redirect to it
                                request.getSession().setAttribute(DBWConstants.STATE_ATTR_SIGN_IN_STATE, DBWConstants.SignInState.GLOBAL);
                                response.sendRedirect(signInLink);
                                return true;
                            }
                        }
                    }
                } catch (Exception e) {
                    log.debug("Error reading auth provider configuration", e);
                }
            }
        }

        return false;
    }

    private static ResourceService makeResourceService() {
        ResourceService resourceService = new ProxyResourceService();
        resourceService.setCacheControl(new HttpField(HttpHeader.CACHE_CONTROL, "public, max-age=" + STATIC_CACHE_SECONDS));
        return resourceService;
    }


    private static class ProxyResourceService extends ResourceService {
        @Override
        protected boolean sendData(HttpServletRequest request, HttpServletResponse response, boolean include, HttpContent content, Enumeration<String> reqRanges) throws IOException {
            String resourceName = content.getResource().getName();
            if (resourceName.endsWith("index.html") || resourceName.endsWith("sso.html")) {
                return patchIndexHtml(response, content);
            }
            return super.sendData(request, response, include, content, reqRanges);
        }

        private boolean patchIndexHtml(HttpServletResponse response, HttpContent content) throws IOException {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Resource resource = content.getResource();
            File file = resource.getFile();
            try (InputStream fis = new FileInputStream(file)) {
                IOUtils.copyStream(fis, baos);
            }
            String indexContents = new String(baos.toByteArray(), StandardCharsets.UTF_8);
            indexContents = indexContents
                .replace("{ROOT_URI}", CBApplication.getInstance().getRootURI())
                .replace("{STATIC_CONTENT}", CBApplication.getInstance().getStaticContent());
            byte[] indexBytes = indexContents.getBytes(StandardCharsets.UTF_8);

            putHeaders(response, content, indexBytes.length);
            response.getOutputStream().write(indexBytes);

            return true;
        }
    }

}
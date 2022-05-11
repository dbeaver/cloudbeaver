package io.cloudbeaver.service.auth.local;

import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.server.CBServerAction;
import io.cloudbeaver.service.DBWServletHandler;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;

import javax.servlet.Servlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

public class LocalServletHandler implements DBWServletHandler {

    public static final String URI_PREFIX = "open";
    public static final String PARAM_CONNECTION_ID = "id";

    private static final Log log = Log.getLog(LocalServletHandler.class);

    @Override
    public boolean handleRequest(Servlet servlet, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        if (URI_PREFIX.equals(WebServiceUtils.removeSideSlashes(request.getPathInfo()))) {
            try {
                WebSession webSession = CBPlatform.getInstance().getSessionManager().getWebSession(request, response, true);
                Map<String, Object> parameters = new HashMap<>();
                for (Enumeration<String> ne = request.getParameterNames(); ne.hasMoreElements(); ) {
                    String paramName = ne.nextElement();
                    parameters.put(paramName, request.getParameter(paramName));
                }
                CBServerAction action = new CBServerAction(LocalSessionHandler.ACTION_CONSOLE, parameters);
                action.saveInSession(webSession);

                response.sendRedirect("/");
                return true;
            } catch (Exception e) {
                log.error("Error saving open DB action in session", e);
            }
        }
        return false;
    }
}

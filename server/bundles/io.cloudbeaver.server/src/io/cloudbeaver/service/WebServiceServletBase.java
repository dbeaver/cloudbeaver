package io.cloudbeaver.service;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.lang.reflect.Type;
import java.util.Map;

public abstract class WebServiceServletBase extends HttpServlet {

    private static final Log log = Log.getLog(WebServiceServletBase.class);
    private static final Type MAP_STRING_OBJECT_TYPE = JSONUtils.MAP_TYPE_TOKEN;
    private static final String REQUEST_PARAM_VARIABLES = "variables";
    private static final Gson gson = new GsonBuilder()
        .serializeNulls()
        .setPrettyPrinting()
        .create();

    private final CBApplication application;

    public WebServiceServletBase(CBApplication application) {
        this.application = application;
    }

    public CBApplication getApplication() {
        return application;
    }

    @Override
    protected final void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        WebSession webSession = CBPlatform.getInstance().getSessionManager().findWebSession(request);
        if (webSession == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Web session not found");
            return;
        }
        try {
            processServiceRequest(webSession, request, response);
        } catch (Exception e) {
            log.error(e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Error processing request: " + e.getMessage());
        }
    }

    protected abstract void processServiceRequest(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException;

    protected Map<String, Object> getVariables(HttpServletRequest request) {
        return gson.fromJson(request.getParameter(REQUEST_PARAM_VARIABLES), MAP_STRING_OBJECT_TYPE);
    }
}
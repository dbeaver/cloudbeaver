package io.cloudbeaver.service;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public abstract class WebServiceServletBase extends HttpServlet {

    private static final Log log = Log.getLog(WebServiceServletBase.class);

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

}
package io.cloudbeaver.server.jetty.filters;

import io.cloudbeaver.model.app.BaseServletApplication;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import java.io.IOException;
import java.time.Duration;

public class ServerConfigurationTimeLimitFilter implements Filter {
    private static final Log log = Log.getLog(ServerConfigurationTimeLimitFilter.class);

    private static final int MINUTES_OF_INACTION_BEFORE_DISABLING_REQUEST_PROCESSING = 60;
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        Filter.super.init(filterConfig);
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        System.out.println("Incoming request: " + httpRequest.getMethod() + " " + httpRequest.getRequestURI());

        if (DBWorkbench.getPlatform().getApplication() instanceof BaseServletApplication servletApplication) {
            if (!servletApplication.isRequestProcessingEnabled()) {
                buildErrorResponse((HttpServletResponse) response);
                return;
            }
            boolean isOutOfTime = System.currentTimeMillis() - servletApplication.getApplicationStartTime()
                > Duration.ofMinutes(MINUTES_OF_INACTION_BEFORE_DISABLING_REQUEST_PROCESSING).toMillis();
            if (servletApplication.isConfigurationMode() && isOutOfTime) {
                log.warn("Server configuration time has expired. A restart server is required to continue");
                servletApplication.disableRequestProcessing();
                buildErrorResponse((HttpServletResponse) response);
                return;

            }
        }
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        Filter.super.destroy();
    }

    private void buildErrorResponse(HttpServletResponse response) throws IOException {
        HttpServletResponse httpResponse = response;
        httpResponse.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        httpResponse.setContentType("application/text");
        httpResponse.getWriter().write("Server configuration time has expired. A restart server is required to continue");
    }
}

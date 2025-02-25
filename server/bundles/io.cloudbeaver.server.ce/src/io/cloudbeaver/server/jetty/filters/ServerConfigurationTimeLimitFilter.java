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

package io.cloudbeaver.server.jetty.filters;

import io.cloudbeaver.server.CBApplication;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.dbeaver.Log;

import java.io.IOException;
import java.time.Duration;

public class ServerConfigurationTimeLimitFilter implements Filter {
    private static final Log log = Log.getLog(ServerConfigurationTimeLimitFilter.class);

    private static final int MINUTES_OF_INACTION_BEFORE_DISABLING_REQUEST_PROCESSING = 2;
    private final CBApplication<?> application;

    public ServerConfigurationTimeLimitFilter(CBApplication<?> application) {
        this.application = application;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        boolean isOutOfTime = System.currentTimeMillis() - application.getApplicationStartTime()
            > Duration.ofMinutes(MINUTES_OF_INACTION_BEFORE_DISABLING_REQUEST_PROCESSING).toMillis();
        if (application.isConfigurationMode() && isOutOfTime) {
            log.warn("Server configuration time has expired. A restart server is required to continue");
            buildErrorResponse((HttpServletResponse) response);
            return;

        }
        chain.doFilter(request, response);
    }

    private void buildErrorResponse(HttpServletResponse response) throws IOException {
        HttpServletResponse httpResponse = response;
        httpResponse.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        httpResponse.setContentType("application/text");
        httpResponse.getWriter().write("Server configuration time has expired. A restart server is required to continue");
    }
}

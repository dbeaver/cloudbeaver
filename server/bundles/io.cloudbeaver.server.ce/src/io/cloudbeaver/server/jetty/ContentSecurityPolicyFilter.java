/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp
 *
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */
package io.cloudbeaver.server.jetty;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

public class ContentSecurityPolicyFilter implements Filter {

    private static final String CSP_HEADER = "Content-Security-Policy";
    private static final List<String> CSP_RULES = List.of(
        "default-src 'self'",
        "frame-ancestors 'self'",
        "form-action 'self'"
    );
    private static final String CSP_POLICY = String.join("; ", CSP_RULES) + ";";

    @Override
    public void doFilter(
        ServletRequest request,
        ServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        if (response instanceof HttpServletResponse http) {
            if (!http.containsHeader(CSP_HEADER)) {
                http.setHeader(CSP_HEADER, CSP_POLICY);
            }
        }
        chain.doFilter(request, response);
    }

}

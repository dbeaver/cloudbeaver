/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

package io.cloudbeaver.server.jetty;

import io.cloudbeaver.service.DBWServletContext;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.jkiss.dbeaver.DBException;

import javax.servlet.http.HttpServlet;

public class CBJettyServletContext implements DBWServletContext {
    private final ServletContextHandler contextHandler;

    public CBJettyServletContext(ServletContextHandler contextHandler) {
        this.contextHandler = contextHandler;
    }

    @Override
    public void addServlet(String servletId, HttpServlet servlet, String mapping) throws DBException {
        contextHandler.addServlet(new ServletHolder(servletId, servlet), mapping);
    }
}

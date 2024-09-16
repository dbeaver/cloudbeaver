/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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

import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBConstants;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.SessionCookieConfig;

public class CBServerContextListener implements ServletContextListener {

    // One week
    //private static final int CB_SESSION_LIFE_TIME = 60 * 60 * 24 * 7;
    private final CBApplication<?> application;

    public CBServerContextListener(CBApplication<?> application) {
        this.application = application;
    }

    public void contextInitialized(ServletContextEvent sce) {
        SessionCookieConfig cookieConfig = sce.getServletContext().getSessionCookieConfig();

        cookieConfig.setComment("Cloudbeaver Session ID");
        //scf.setDomain(domain);
        //scf.setMaxAge(CB_SESSION_LIFE_TIME);
        cookieConfig.setPath(CBApplication.getInstance().getRootURI());
//        cookieConfig.setSecure(application.getServerURL().startsWith("https"));
        cookieConfig.setHttpOnly(true);
        cookieConfig.setName(CBConstants.CB_SESSION_COOKIE_NAME);
    }

    public void contextDestroyed(ServletContextEvent sce) {

    }
}
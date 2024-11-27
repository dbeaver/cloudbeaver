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

import io.cloudbeaver.server.WebApplication;
import org.eclipse.jetty.ee10.servlet.ServletContextHandler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.session.DefaultSessionCache;
import org.eclipse.jetty.session.DefaultSessionIdManager;
import org.eclipse.jetty.session.NullSessionDataStore;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;

public class JettyUtils {
    private static final Log log = Log.getLog(JettyUtils.class);

    public static void initSessionManager(
        long maxIdleTime,
        @NotNull WebApplication application,
        @NotNull Server server,
        @NotNull ServletContextHandler servletContextHandler
    ) {
        // Init sessions persistence
        CBSessionHandler sessionHandler = new CBSessionHandler(application);
        sessionHandler.setRefreshCookieAge(CBSessionHandler.ONE_MINUTE);
        int intMaxIdleSeconds;
        if (maxIdleTime > Integer.MAX_VALUE) {
            log.warn("Max session idle time value is greater than Integer.MAX_VALUE. Integer.MAX_VALUE will be used instead");
            maxIdleTime = Integer.MAX_VALUE;
        }
        intMaxIdleSeconds = (int) (maxIdleTime / 1000);
        log.debug("Max http session idle time: " + intMaxIdleSeconds + "s");
        sessionHandler.setMaxInactiveInterval(intMaxIdleSeconds);
        sessionHandler.setMaxCookieAge(intMaxIdleSeconds);

        DefaultSessionCache sessionCache = new DefaultSessionCache(sessionHandler);
        sessionCache.setSessionDataStore(new NullSessionDataStore());
        sessionHandler.setSessionCache(sessionCache);
        servletContextHandler.setSessionHandler(sessionHandler);

        DefaultSessionIdManager idMgr = new DefaultSessionIdManager(server);
        idMgr.setWorkerName(null);
        server.addBean(idMgr, true);
    }
}

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
import jakarta.servlet.SessionCookieConfig;
import org.eclipse.jetty.http.Syntax;
import org.eclipse.jetty.server.session.SessionHandler;

public class CBSessionHandler extends SessionHandler {
    private final CBCookieConfig cbCookieConfig;
    private final CBApplication<?> application;

    public CBSessionHandler(CBApplication<?> application) {
        this.cbCookieConfig = new CBCookieConfig();
        this.application = application;
    }


    @Override
    public SessionCookieConfig getSessionCookieConfig() {
        return this.cbCookieConfig;
    }


    //mostly copy of org.eclipse.jetty.server.session.CookieConfig but allows to use dynamic setSecure flag
    public final class CBCookieConfig implements SessionCookieConfig {
        public CBCookieConfig() {
        }

        public String getComment() {
            return CBSessionHandler.this._sessionComment;
        }

        public String getDomain() {
            return CBSessionHandler.this._sessionDomain;
        }

        public int getMaxAge() {
            return CBSessionHandler.this._maxCookieAge;
        }

        public String getName() {
            return CBSessionHandler.this._sessionCookie;
        }

        public String getPath() {
            return CBSessionHandler.this._sessionPath;
        }

        public boolean isHttpOnly() {
            return CBSessionHandler.this._httpOnly;
        }

        public boolean isSecure() {
            return CBSessionHandler.this.application.getServerURL().startsWith("https");
        }

        public void setComment(String comment) {
            if (CBSessionHandler.this._context != null && CBSessionHandler.this._context.getContextHandler()
                .isAvailable()) {
                throw new IllegalStateException("CookieConfig cannot be set after ServletContext is started");
            } else {
                CBSessionHandler.this._sessionComment = comment;
            }
        }

        public void setDomain(String domain) {
            if (CBSessionHandler.this._context != null && CBSessionHandler.this._context.getContextHandler()
                .isAvailable()) {
                throw new IllegalStateException("CookieConfig cannot be set after ServletContext is started");
            } else {
                CBSessionHandler.this._sessionDomain = domain;
            }
        }

        public void setHttpOnly(boolean httpOnly) {
            if (CBSessionHandler.this._context != null && CBSessionHandler.this._context.getContextHandler()
                .isAvailable()) {
                throw new IllegalStateException("CookieConfig cannot be set after ServletContext is started");
            } else {
                CBSessionHandler.this._httpOnly = httpOnly;
            }
        }

        public void setMaxAge(int maxAge) {
            if (CBSessionHandler.this._context != null && CBSessionHandler.this._context.getContextHandler()
                .isAvailable()) {
                throw new IllegalStateException("CookieConfig cannot be set after ServletContext is started");
            } else {
                CBSessionHandler.this._maxCookieAge = maxAge;
            }
        }

        public void setName(String name) {
            if (CBSessionHandler.this._context != null && CBSessionHandler.this._context.getContextHandler()
                .isAvailable()) {
                throw new IllegalStateException("CookieConfig cannot be set after ServletContext is started");
            } else if ("".equals(name)) {
                throw new IllegalArgumentException("Blank cookie name");
            } else {
                if (name != null) {
                    Syntax.requireValidRFC2616Token(name, "Bad Session cookie name");
                }

                CBSessionHandler.this._sessionCookie = name;
            }
        }

        public void setPath(String path) {
            if (CBSessionHandler.this._context != null && CBSessionHandler.this._context.getContextHandler()
                .isAvailable()) {
                throw new IllegalStateException("CookieConfig cannot be set after ServletContext is started");
            } else {
                CBSessionHandler.this._sessionPath = path;
            }
        }

        public void setSecure(boolean secure) {
            if (CBSessionHandler.this._context != null && CBSessionHandler.this._context.getContextHandler()
                .isAvailable()) {
                throw new IllegalStateException("CookieConfig cannot be set after ServletContext is started");
            } else {
                CBSessionHandler.this._secureCookies = secure;
            }
        }
    }


}

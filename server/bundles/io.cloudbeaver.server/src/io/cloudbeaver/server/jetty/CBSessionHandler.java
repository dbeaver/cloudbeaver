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

import io.cloudbeaver.server.GQLApplicationAdapter;
import jakarta.servlet.SessionCookieConfig;
import org.eclipse.jetty.ee10.servlet.ServletContextHandler;
import org.eclipse.jetty.ee10.servlet.SessionHandler;

import java.util.Collections;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

public class CBSessionHandler extends SessionHandler {
    private final CBCookieConfig cbCookieConfig;
    private final GQLApplicationAdapter application;

    public CBSessionHandler(GQLApplicationAdapter application) {
        this.cbCookieConfig = new CBCookieConfig();
        this.application = application;
    }


    @Override
    public SessionCookieConfig getSessionCookieConfig() {
        return this.cbCookieConfig;
    }


    //mostly copy of org.eclipse.jetty.ee10.servlet.CookieConfig but allows to use dynamic setSecure flag
    public final class CBCookieConfig implements SessionCookieConfig {

        @Override
        public boolean isSecure() {
            var serverUrl = CBSessionHandler.this.application.getServerURL();
            return serverUrl != null && serverUrl.startsWith("https://");
        }

        @Override
        public String getComment() {
            return getSessionComment();
        }

        @Override
        public String getDomain() {
            return getSessionDomain();
        }

        @Override
        public int getMaxAge() {
            return getMaxCookieAge();
        }

        @Override
        public void setAttribute(String name, String value) {
            checkState();
            String lcase = name.toLowerCase(Locale.ENGLISH);

            switch (lcase) {
                case "name" -> setName(value);
                case "max-age" -> setMaxAge(value == null ? -1 : Integer.parseInt(value));
                case "comment" -> setComment(value);
                case "domain" -> setDomain(value);
                case "httponly" -> setHttpOnly(Boolean.parseBoolean(value));
                case "secure" -> setSecure(Boolean.parseBoolean(value));
                case "path" -> setPath(value);
                default -> setSessionCookieAttribute(name, value);
            }
        }

        @Override
        public String getAttribute(String name) {
            String lcase = name.toLowerCase(Locale.ENGLISH);
            return switch (lcase) {
                case "name" -> getName();
                case "max-age" -> Integer.toString(getMaxAge());
                case "comment" -> getComment();
                case "domain" -> getDomain();
                case "httponly" -> String.valueOf(isHttpOnly());
                case "secure" -> String.valueOf(isSecure());
                case "path" -> getPath();
                default -> getSessionCookieAttribute(name);
            };
        }

        /**
         * According to the SessionCookieConfig javadoc, the attributes must also include
         * all values set by explicit setters.
         *
         * @see SessionCookieConfig
         */
        @Override
        public Map<String, String> getAttributes() {
            Map<String, String> specials = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
            specials.put("name", getAttribute("name"));
            specials.put("max-age", getAttribute("max-age"));
            specials.put("comment", getAttribute("comment"));
            specials.put("domain", getAttribute("domain"));
            specials.put("httponly", getAttribute("httponly"));
            specials.put("secure", getAttribute("secure"));
            specials.put("path", getAttribute("path"));
            specials.putAll(getSessionCookieAttributes());
            return Collections.unmodifiableMap(specials);
        }

        @Override
        public String getName() {
            return getSessionCookie();
        }

        @Override
        public String getPath() {
            return getSessionPath();
        }

        @Override
        public boolean isHttpOnly() {
            return CBSessionHandler.this.isHttpOnly();
        }

        @Override
        public void setComment(String comment) {
            checkState();
            CBSessionHandler.this.setSessionComment(comment);
        }

        @Override
        public void setDomain(String domain) {
            checkState();
            CBSessionHandler.this.setSessionDomain(domain);
        }

        @Override
        public void setHttpOnly(boolean httpOnly) {
            checkState();
            CBSessionHandler.this.setHttpOnly(httpOnly);
        }

        @Override
        public void setMaxAge(int maxAge) {
            checkState();
            CBSessionHandler.this.setMaxCookieAge(maxAge);
        }

        @Override
        public void setName(String name) {
            checkState();
            CBSessionHandler.this.setSessionCookie(name);
        }

        @Override
        public void setPath(String path) {
            checkState();
            CBSessionHandler.this.setSessionPath(path);
        }

        @Override
        public void setSecure(boolean secure) {
            checkState();
            CBSessionHandler.this.setSecureCookies(secure);
        }

        private void checkState() {
            //It is allowable to call the CookieConfig.setXX methods after the SessionHandler has started,
            //but before the context has fully started. Ie it is allowable for ServletContextListeners
            //to call these methods in contextInitialized().
            ServletContextHandler handler = ServletContextHandler.getCurrentServletContextHandler();
            if (handler != null && handler.isAvailable())
                throw new IllegalStateException("CookieConfig cannot be set after ServletContext is started");

        }
    }


}

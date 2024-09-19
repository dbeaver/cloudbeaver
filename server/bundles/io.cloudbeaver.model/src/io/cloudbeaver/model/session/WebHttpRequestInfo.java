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
package io.cloudbeaver.model.session;

import jakarta.servlet.http.HttpServletRequest;

public class WebHttpRequestInfo {

    private final String id;
    private final Object locale;
    private final String lastRemoteAddress;
    private final String lastRemoteUserAgent;

    public WebHttpRequestInfo(HttpServletRequest request) {
        this.id = request.getSession().getId();
        this.locale = request.getAttribute("locale");
        this.lastRemoteAddress = request.getRemoteAddr();
        this.lastRemoteUserAgent = request.getHeader("User-Agent");
    }

    public WebHttpRequestInfo(String id, Object locale, String lastRemoteAddress, String lastRemoteUserAgent) {
        this.id = id;
        this.locale = locale;
        this.lastRemoteAddress = lastRemoteAddress;
        this.lastRemoteUserAgent = lastRemoteUserAgent;
    }

    public String getId() {
        return id;
    }

    public Object getLocale() {
        return locale;
    }

    public String getLastRemoteAddress() {
        return lastRemoteAddress;
    }

    public String getLastRemoteUserAgent() {
        return lastRemoteUserAgent;
    }
}

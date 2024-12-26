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
import org.jkiss.code.Nullable;

public class WebHttpRequestInfo {
    public static final String USER_AGENT = "User-Agent";

    @Nullable
    private final String id;
    @Nullable
    private final Object locale;
    @Nullable
    private final String lastRemoteAddress;
    @Nullable
    private final String lastRemoteUserAgent;

    public WebHttpRequestInfo(HttpServletRequest request) {
        this.id = request.getSession() == null ? null : request.getSession().getId();
        this.locale = request.getAttribute("locale");
        this.lastRemoteAddress = request.getRemoteAddr();
        this.lastRemoteUserAgent = request.getHeader(USER_AGENT);
    }

    public WebHttpRequestInfo(
        @Nullable String id,
        @Nullable Object locale,
        @Nullable String lastRemoteAddress,
        @Nullable String lastRemoteUserAgent
    ) {
        this.id = id;
        this.locale = locale;
        this.lastRemoteAddress = lastRemoteAddress;
        this.lastRemoteUserAgent = lastRemoteUserAgent;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public Object getLocale() {
        return locale;
    }

    @Nullable
    public String getLastRemoteAddress() {
        return lastRemoteAddress;
    }

    @Nullable
    public String getLastRemoteUserAgent() {
        return lastRemoteUserAgent;
    }
}

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
package io.cloudbeaver.server;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebHeadlessSession;
import io.cloudbeaver.model.session.WebHttpRequestInfo;
import io.cloudbeaver.model.session.WebSession;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;

import java.util.Collection;

public interface WebAppSessionManager {
    BaseWebSession closeSession(@NotNull HttpServletRequest request);

    BaseWebSession closeSession(@NotNull String sessionId);

    @NotNull
    WebSession getWebSession(
        @NotNull HttpServletRequest request,
        @NotNull HttpServletResponse response
    ) throws DBWebException;

    @NotNull
    WebSession getWebSession(
        @NotNull HttpServletRequest request,
        @NotNull HttpServletResponse response,
        boolean errorOnNoFound
    ) throws DBWebException;

    @Nullable
    BaseWebSession getSession(@NotNull String sessionId);

    @Nullable
    WebSession findWebSession(HttpServletRequest request);

    WebSession findWebSession(HttpServletRequest request, boolean errorOnNoFound) throws DBWebException;

    Collection<BaseWebSession> getAllActiveSessions();

    WebSession getOrRestoreWebSession(WebHttpRequestInfo httpRequest);

    WebHeadlessSession getHeadlessSession(
        @Nullable String smAccessToken,
        @NotNull WebHttpRequestInfo requestInfo,
        boolean create
    ) throws DBException;

    boolean touchSession(HttpServletRequest request, HttpServletResponse response) throws DBWebException;

    default void expireIdleSessions() {

    }
}

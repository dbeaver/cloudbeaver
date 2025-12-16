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
package io.cloudbeaver.test.platform;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebHeadlessSession;
import io.cloudbeaver.model.session.WebHttpRequestInfo;
import io.cloudbeaver.server.WebAppSessionManager;
import io.cloudbeaver.server.websockets.CBEventsLongPollingServlet;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.HttpConstants;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.Mockito;

public class CBEventsLongPollingServletTest extends CloudbeaverMockTest {

    @Mock
    HttpServletRequest request;

    @Mock
    WebAppSessionManager sessionManager;

    @Mock
    WebHeadlessSession headlessSession;

    @Before
    public void initMocks() {
        request = Mockito.mock(HttpServletRequest.class);
        sessionManager = Mockito.mock(WebAppSessionManager.class);
        headlessSession = Mockito.mock(WebHeadlessSession.class);
    }

    private class TestServlet extends CBEventsLongPollingServlet {

        @Nullable
        @Override
        protected BaseWebSession resolveSession(@NotNull HttpServletRequest req) {

            String sid = req.getHeader(WSConstants.WS_SESSION_HEADER);
            String token = req.getHeader(WSConstants.WS_AUTH_HEADER);

            if (CommonUtils.isEmpty(sid) && CommonUtils.isEmpty(token)) {
                return null;
            }

            WebHttpRequestInfo info = new WebHttpRequestInfo(
                sid,
                req.getAttribute("locale"),
                req.getRemoteAddr(),
                req.getHeader(HttpConstants.HEADER_USER_AGENT)
            );

            try {

                return sessionManager.getHeadlessSession(token, info, true);
            } catch (Exception e) {
                return null;
            }
        }
    }

    @Test
    public void testResolveSessionReturnsHeadless() throws DBException {

        Mockito.when(request.getHeader(WSConstants.WS_AUTH_HEADER)).thenReturn("token-123");
        Mockito.when(request.getHeader(WSConstants.WS_SESSION_HEADER)).thenReturn("sid-555");
        Mockito.when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        Mockito.when(request.getHeader("User-Agent")).thenReturn("JUnit");

        Mockito.when(sessionManager.getHeadlessSession(
                ArgumentMatchers.eq("token-123"),
                ArgumentMatchers.any(WebHttpRequestInfo.class), ArgumentMatchers.eq(true)))
            .thenReturn(headlessSession);

        BaseWebSession resolved = invokeResolve(new TestServlet(), request);

        Assert.assertSame(headlessSession, resolved);
    }

    @Test
    public void testResolveSessionFailsWhenNoToken() throws DBException {

        Mockito.when(request.getHeader(WSConstants.WS_AUTH_HEADER)).thenReturn(null);
        Mockito.when(request.getHeader(WSConstants.WS_SESSION_HEADER)).thenReturn("sid-123");

        Mockito.when(sessionManager.getHeadlessSession(ArgumentMatchers.any(),
                ArgumentMatchers.any(), ArgumentMatchers.anyBoolean()))
            .thenReturn(null);

        Assert.assertNull(invokeResolve(new TestServlet(), request));
    }

    @Test
    public void testResolveSessionFailsWhenManagerThrows() throws DBException {

        Mockito.when(request.getHeader(WSConstants.WS_AUTH_HEADER)).thenReturn("boom");
        Mockito.when(request.getHeader(WSConstants.WS_SESSION_HEADER)).thenReturn("sid-123");
        Mockito.when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        Mockito.when(sessionManager.getHeadlessSession(ArgumentMatchers.eq("boom"),
                ArgumentMatchers.any(WebHttpRequestInfo.class), ArgumentMatchers.eq(true)))
            .thenThrow(new RuntimeException("Get HeadlessSession failed"));

        Assert.assertNull(invokeResolve(new TestServlet(), request));
    }

    private BaseWebSession invokeResolve(TestServlet servlet, HttpServletRequest req) {
        return servlet.resolveSession(req);
    }
}

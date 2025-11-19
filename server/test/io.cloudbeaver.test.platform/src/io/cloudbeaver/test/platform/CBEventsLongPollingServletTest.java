package io.cloudbeaver.test.platform;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebHeadlessSession;
import io.cloudbeaver.model.session.WebHttpRequestInfo;
import io.cloudbeaver.server.WebAppSessionManager;
import io.cloudbeaver.server.websockets.CBEventsLongPollingServlet;
import jakarta.servlet.http.HttpServletRequest;
import org.eclipse.jetty.http.BadMessageException;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.junit.osgi.annotation.RunWithApplication;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.Mockito;

import java.lang.reflect.InvocationTargetException;

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
        @Override
        protected WebHeadlessSession getHeadlessSession(String token, WebHttpRequestInfo info) throws DBException {
            return sessionManager.getHeadlessSession(token, info, true);
        }
    }

    @Test
    public void testResolveSessionReturnsHeadless() throws Exception {
        CBEventsLongPollingServlet servlet = new TestServlet();

        Mockito.when(request.getHeader(WSConstants.WS_AUTH_HEADER)).thenReturn("token-123");
        Mockito.when(request.getHeader(WSConstants.WS_SESSION_HEADER)).thenReturn("sid-555");
        Mockito.when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        Mockito.when(request.getHeader("User-Agent")).thenReturn("JUnit");

        Mockito.when(sessionManager.getHeadlessSession(
                ArgumentMatchers.eq("token-123"),
                ArgumentMatchers.any(WebHttpRequestInfo.class), ArgumentMatchers.eq(true)))
            .thenReturn(headlessSession);

        BaseWebSession resolved = invokeResolve(servlet, request);

        Assert.assertSame(headlessSession, resolved);
    }

    @Test(expected = BadMessageException.class)
    public void testResolveSessionFailsWhenNoToken() throws Exception {

        Mockito.when(request.getHeader(WSConstants.WS_AUTH_HEADER)).thenReturn(null);
        Mockito.when(request.getHeader(WSConstants.WS_SESSION_HEADER)).thenReturn("sid-123");

        Mockito.when(sessionManager.getHeadlessSession(ArgumentMatchers.any(),
                ArgumentMatchers.any(), ArgumentMatchers.anyBoolean()))
            .thenReturn(null);

        CBEventsLongPollingServlet servlet = new TestServlet();
        invokeResolve(servlet, request);
    }

    @Test(expected = BadMessageException.class)
    public void testResolveSessionFailsWhenManagerThrows() throws Exception {

        Mockito.when(request.getHeader(WSConstants.WS_AUTH_HEADER)).thenReturn("boom");
        Mockito.when(request.getHeader(WSConstants.WS_SESSION_HEADER)).thenReturn("sid-123");
        Mockito.when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        Mockito.when(sessionManager.getHeadlessSession(ArgumentMatchers.eq("boom"),
                ArgumentMatchers.any(WebHttpRequestInfo.class), ArgumentMatchers.eq(true)))
            .thenThrow(new RuntimeException("Get HeadlessSession failed"));

        CBEventsLongPollingServlet servlet = new TestServlet();
        invokeResolve(servlet, request);
    }

    private BaseWebSession invokeResolve(CBEventsLongPollingServlet servlet, HttpServletRequest req) throws Exception {
        var m = CBEventsLongPollingServlet.class.getDeclaredMethod("resolveSession", HttpServletRequest.class);
        m.setAccessible(true);
        try {
            return (BaseWebSession) m.invoke(servlet, req);
        } catch (InvocationTargetException e) {
            Throwable cause = e.getCause();
            if (cause instanceof Exception ex) {
                throw ex;
            }
            throw e;
        }
    }
}

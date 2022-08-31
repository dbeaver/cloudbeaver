package io.cloudbeaver.test.platform;

import io.cloudbeaver.auth.provider.rp.RPAuthProvider;
import io.cloudbeaver.utils.WebTestUtils;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class AuthenticationTest {
    public static final String GQL_TEMPLATE_OPEN_SESSION = "openSession.json";
    public static final String GQL_TEMPLATE_ACTIVE_USER = "activeUser.json";
    public static final String REVERSE_PROXY_TEST_USER = "reverseProxyTestUser";

    @Test
    public void testLoginUser() throws Exception {
        HttpClient client = CEServerTestSuite.getClient();
        Map<String, Object> authInfo = WebTestUtils.authenticateUser(
            client, CEServerTestSuite.getScriptsPath(), CEServerTestSuite.GQL_API_URL);
        Assert.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));
    }

    @Test
    public void testReverseProxyAnonymousModeLogin() throws Exception {
        HttpClient client = CEServerTestSuite.getClient();
        Map<String, Object> sessionInfo = openSession(client);
        Assert.assertTrue(JSONUtils.getBoolean(sessionInfo, "valid"));
        Map<String, Object> activeUser = getActiveUser(client);
        Assert.assertEquals(REVERSE_PROXY_TEST_USER, JSONUtils.getString(activeUser, "userId"));
    }

    private Map<String, Object> openSession(HttpClient client) throws Exception {
        Map<String, Object> data = doPostQuery(client, GQL_TEMPLATE_OPEN_SESSION);
        if (data != null) {
            return JSONUtils.getObject(data, "session");
        }
        return Collections.emptyMap();
    }

    private Map<String, Object> getActiveUser(HttpClient client) throws Exception {
        Map<String, Object> data = doPostQuery(client, GQL_TEMPLATE_ACTIVE_USER);
        if (data != null) {
            return JSONUtils.getObject(data, "user");
        }
        return Collections.emptyMap();
    }

    private Map<String, Object> doPostQuery(HttpClient client, String gqlScript) throws Exception {
        String input = WebTestUtils.readScriptTemplate(gqlScript, CEServerTestSuite.getScriptsPath());
        List<String> headers = List.of(RPAuthProvider.X_USER, REVERSE_PROXY_TEST_USER, RPAuthProvider.X_ROLE, "user");
        Map<String, Object> map = WebTestUtils.doPostWithHeaders(CEServerTestSuite.GQL_API_URL, input, client, headers);
        return JSONUtils.getObjectOrNull(map, "data");
    }


}

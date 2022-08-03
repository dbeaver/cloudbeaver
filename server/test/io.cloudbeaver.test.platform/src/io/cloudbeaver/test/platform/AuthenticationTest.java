package io.cloudbeaver.test.platform;

import io.cloudbeaver.utils.WebTestUtils;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.junit.Assert;
import org.junit.Test;

import java.net.http.HttpClient;
import java.util.Map;

public class AuthenticationTest {

    @Test
    public void testLoginUser() throws Exception {
        HttpClient client = CEServerTestSuite.getClient();
        Map<String, Object> authInfo = WebTestUtils.authenticateUser(
            client, CEServerTestSuite.getScriptsPath(), CEServerTestSuite.GQL_API_URL);
        Assert.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));
    }
}

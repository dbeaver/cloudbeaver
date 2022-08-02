package io.cloudbeaver.test.platform;

import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.CommonUtils;
import org.junit.Assert;
import org.junit.Test;

import java.net.http.HttpClient;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Map;

public class AuthenticationTest {

    public static final String GQL_TEMPLATE_AUTH_LOGIN = "authLogin.json";

    @Test
    public void testLoginUser() throws Exception {
        HttpClient client = AllTests.getClient();
        Map<String, Object> authInfo = authenticateUser(client, AllTests.getScriptsPath());
        Assert.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));
    }

    public static Map<String, Object> authenticateUser(HttpClient client, Path scriptsPath) throws Exception {
        String input = AllTests.readScriptTemplate(GQL_TEMPLATE_AUTH_LOGIN, scriptsPath);
        Map<String, Object> map = AllTests.doPost(input, client);
        Map<String, Object> data = JSONUtils.getObjectOrNull(map, "data");
        if (data != null) {
            return JSONUtils.getObjectOrNull(data, "authInfo");
        }
        return Collections.emptyMap();
    }
}

package io.cloudbeaver;

import io.cloudbeaver.utils.WebTestUtils;
import org.jkiss.junit.osgi.OSGITestRunner;
import org.jkiss.junit.osgi.annotation.RunWithApplication;
import org.jkiss.junit.osgi.annotation.RunWithProduct;
import org.jkiss.junit.osgi.annotation.RunnerProxy;
import org.jkiss.junit.osgi.behaviors.IAsyncApplication;
import org.junit.runner.RunWith;
import org.mockito.junit.MockitoJUnitRunner;

import java.net.CookieManager;
import java.net.http.HttpClient;

@RunWithProduct("CloudbeaverServerUnitTest.product")
@RunnerProxy(MockitoJUnitRunner.class)
@RunWith(OSGITestRunner.class)
@RunWithApplication(bundleName = "io.cloudbeaver.server.ce", registryName = "io.cloudbeaver.product.ce.application", args = {"-web-config", "workspace/conf/cloudbeaver.conf"})
public abstract class CloudbeaverMockTest implements IAsyncApplication {
    private static final String GQL_API_URL = "http://localhost:18978/api/gql";
    private static final String SERVER_STATUS_URL = "http://localhost:18978/status";
    private final HttpClient httpClient = HttpClient.newBuilder()
        .cookieHandler(new CookieManager())
        .version(HttpClient.Version.HTTP_2)
        .build();;
    public boolean verifyLaunched() {
        return WebTestUtils.getServerStatus(httpClient, SERVER_STATUS_URL);
    }
}

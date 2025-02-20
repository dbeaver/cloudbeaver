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
import io.cloudbeaver.app.CEAppStarter;
import org.junit.Assert;
import org.junit.Test;

import java.net.CookieManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class NoSessionTest extends CloudbeaverMockTest {

    @Test
    public void checkThatSessionNotCreatedWhenStaticResourcesCalled() throws Exception {
        var cookieManager = new CookieManager();
        HttpClient httpClient = HttpClient.newBuilder()
            .cookieHandler(cookieManager)
            .version(HttpClient.Version.HTTP_2)
            .build();

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(CEAppStarter.SERVER_URL + "/favicon.ico"))
            .GET()
            .build();

        httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

        Assert.assertTrue(cookieManager.getCookieStore().getCookies().isEmpty());
    }
}

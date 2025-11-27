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

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.app.ServletAuthApplication;
import org.jkiss.dbeaver.model.websocket.event.WSEventController;
import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Function;

public class WebSessionTest extends CloudbeaverMockTest {

    @Test
    public void localeAndBasicAttributes() throws Exception {
        WebSession session = new WebSession(mockRequestInfo(), mockApplication(), Collections.emptyMap());
        // Locale
        session.setLocale("ru");
        Assert.assertEquals("ru", session.getLocale());
        session.setLocale(null);
        Assert.assertEquals(Locale.getDefault().getLanguage(), session.getLocale());

        // Persistent attribute must survive reset/close
        session.setAttribute("persistentKey", "persistValue", true);
        Assert.assertEquals("persistValue", session.getAttribute("persistentKey"));

        // Non-persistent attribute created via getAttribute with creator/disposer
        AtomicBoolean disposed = new AtomicBoolean(false);
        Function<String, String> creator = (s) -> "created";
        Function<String, String> disposer = (s) -> {
            disposed.set(true);
            return null;
        };

        String created = session.getAttribute("createdKey", creator, disposer);
        Assert.assertEquals("created", created);

        // After close() non-persistent attribute should be disposed; persistent remain
        session.close();

        Assert.assertTrue("disposer must be invoked during close()", disposed.get());
        // persistent attribute should still be available
        Assert.assertEquals("persistValue", session.getAttribute("persistentKey"));
    }

    @Test
    public void asyncTaskStatusNotFound() throws Exception {
        WebSession session = new WebSession(mockRequestInfo(), mockApplication(), Collections.emptyMap());
        Assert.assertThrows(
            "DBWebException must be thrown for unknown async task",
            DBWebException.class, () -> session.asyncTaskStatus("nonexistent-task", false)
        );
    }

    private WebHttpRequestInfo mockRequestInfo() {
        WebHttpRequestInfo req = Mockito.mock(WebHttpRequestInfo.class);
        Mockito.when(req.getId()).thenReturn("test-session-id");
        Mockito.when(req.getLocale()).thenReturn("en");
        Mockito.when(req.getLastRemoteAddress()).thenReturn("127.0.0.1");
        Mockito.when(req.getLastRemoteUserAgent()).thenReturn("JUnit");
        return req;
    }

    private ServletAuthApplication mockApplication() {
        ServletAuthApplication app = Mockito.mock(ServletAuthApplication.class);
        WSEventController eventController = Mockito.mock(WSEventController.class);

        // Make configuration/anonymous checks safe for constructor
        Mockito.when(app.isAnonymousAccessEnabled()).thenReturn(false);
        Mockito.when(app.getEventController()).thenReturn(eventController);
        return app;
    }
}
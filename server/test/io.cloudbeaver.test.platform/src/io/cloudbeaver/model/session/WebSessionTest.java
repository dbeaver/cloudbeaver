/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
import org.jkiss.utils.function.ThrowableConsumer;
import org.jkiss.utils.function.ThrowableFunction;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

public class WebSessionTest extends CloudbeaverMockTest {

    private WebSession session;

    @BeforeEach
    public void initWebSession() throws Exception {
        session = new WebSession(getFakeRequestInfo(), mockApplication(), Collections.emptyMap());
    }

    @Test
    public void localeAndBasicAttributes() throws Exception {
        // Locale
        session.setLocale("test-locale");
        Assertions.assertEquals("test-locale", session.getLocale());
        session.setLocale(null);
        Assertions.assertEquals(Locale.getDefault().getLanguage(), session.getLocale());

        // Persistent attribute must survive reset/close
        session.setAttribute("persistentKey", "persistValue", true);
        Assertions.assertEquals("persistValue", session.getAttribute("persistentKey"));

        // Non-persistent attribute created via getAttribute with creator/disposer
        AtomicBoolean disposed = new AtomicBoolean(false);
        ThrowableFunction<String, String, Exception> creator = (s) -> "created";
        ThrowableConsumer<String, Exception> disposer = (s) -> {
            disposed.set(true);
        };

        String created = session.getAttribute("createdKey", creator, disposer);
        Assertions.assertEquals("created", created);

        // persistent attribute should still be available
        Assertions.assertEquals("persistValue", session.getAttribute("persistentKey"));

        session.close();

        // persistent attribute should иу тгдд
        Assertions.assertNull(session.getAttribute("persistentKey"), "persistValue");
        Assertions.assertTrue(disposed.get(), "disposer must be invoked during close()");
    }

    @Test
    public void asyncTaskStatusNotFound() throws Exception {
        Assertions.assertThrows(
            DBWebException.class, () -> session.asyncTaskStatus("nonexistent-task", false),
            "DBWebException must be thrown for unknown async task"
        );
    }

    private WebHttpRequestInfo getFakeRequestInfo() {
        return new WebHttpRequestInfo(
            "test-session-id",
            "en",
            "127.0.0.1",
            "JUnit"
        );
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

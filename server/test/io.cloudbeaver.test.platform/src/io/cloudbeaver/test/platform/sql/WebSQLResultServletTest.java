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
package io.cloudbeaver.test.platform.sql;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebUserContext;
import io.cloudbeaver.server.BaseWebPlatform;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.service.session.CBSessionManager;
import io.cloudbeaver.service.sql.DBWServiceSQL;
import io.cloudbeaver.service.sql.WebSQLCellValueReceiver;
import io.cloudbeaver.service.sql.WebSQLDataLOBReceiver;
import io.cloudbeaver.service.sql.WebSQLResultServlet;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.data.DBDAttributeBindingMeta;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.websocket.event.WSEventController;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.Map;

public class WebSQLResultServletTest {
    @TempDir
    Path exportFolder;

    private final DBRProgressMonitor monitor = new VoidProgressMonitor();
    private MockedStatic<WebAppUtils> webAppUtils;
    private TestServlet servlet;
    private CBApplication<?> application;

    @BeforeEach
    public void setUp() {
        BaseWebPlatform platform = Mockito.mock(BaseWebPlatform.class);
        Mockito.when(platform.getTempFolder(Mockito.any(), Mockito.eq("sql-lob-files"))).thenReturn(exportFolder);
        webAppUtils = Mockito.mockStatic(WebAppUtils.class, Mockito.withSettings().mockMaker("mock-maker-inline"));
        webAppUtils.when(WebAppUtils::getWebPlatform).thenReturn(platform);
        application = Mockito.mock(CBApplication.class);
        Mockito.when(application.getMaxSessionIdleTime()).thenReturn(60_000L);
        Mockito.when(application.getEventController()).thenReturn(Mockito.mock(WSEventController.class));
        servlet = new TestServlet();
    }

    @AfterEach
    public void tearDown() {
        webAppUtils.close();
    }

    @Test
    public void ownerCanDownloadAndDeleteExportWithoutChangingFileName() throws Exception {
        WebSession session = session("owner");
        String fileName = createLobFile(session, "owner data");
        Path file = exportFolder.resolve("owner").resolve(fileName);

        Assertions.assertTrue(fileName.matches("table_column_\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}-\\d{2}"));
        Assertions.assertEquals("owner data", Files.readString(file));
        Assertions.assertFalse(Files.exists(exportFolder.resolve(fileName)));

        HttpServletResponse response = Mockito.mock(HttpServletResponse.class);
        ByteArrayOutputStream output = captureOutput(response);
        servlet.processServiceRequest(session, request("/" + fileName), response);

        Assertions.assertEquals("owner data", output.toString(StandardCharsets.UTF_8));
        Assertions.assertFalse(Files.exists(file));
        Mockito.verify(response).setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
        Mockito.verify(response).setHeader("Cache-Control", "private, no-store");
        Mockito.verify(response, Mockito.never()).setDateHeader(Mockito.eq("Expires"), Mockito.anyLong());
    }

    @Test
    public void anotherSessionCannotReadOrDeleteExport() throws Exception {
        WebSession owner = session("owner");
        String fileName = createLobFile(owner, "owner data");
        Path file = exportFolder.resolve("owner").resolve(fileName);
        HttpServletResponse response = Mockito.mock(HttpServletResponse.class);

        Assertions.assertThrows(NoSuchFileException.class,
            () -> servlet.processServiceRequest(session("other"), request("/" + fileName), response));

        Assertions.assertEquals("owner data", Files.readString(file));
        Mockito.verify(response, Mockito.never()).getOutputStream();

        ByteArrayOutputStream output = captureOutput(response);
        servlet.processServiceRequest(owner, request("/" + fileName), response);
        Assertions.assertEquals("owner data", output.toString(StandardCharsets.UTF_8));
        Assertions.assertFalse(Files.exists(file));
    }

    @Test
    public void identicalFileNamesAreIsolatedBetweenSessions() throws Exception {
        String fileName = "table_column_2026-11-13_12-00-00";
        Path firstFile = Files.createDirectories(exportFolder.resolve("first")).resolve(fileName);
        Path secondFile = Files.createDirectories(exportFolder.resolve("second")).resolve(fileName);
        Files.writeString(firstFile, "first data");
        Files.writeString(secondFile, "second data");

        HttpServletResponse firstResponse = Mockito.mock(HttpServletResponse.class);
        ByteArrayOutputStream firstOutput = captureOutput(firstResponse);
        servlet.processServiceRequest(session("first"), request("/" + fileName), firstResponse);

        Assertions.assertEquals("first data", firstOutput.toString(StandardCharsets.UTF_8));
        Assertions.assertFalse(Files.exists(firstFile));
        Assertions.assertEquals("second data", Files.readString(secondFile));

        HttpServletResponse secondResponse = Mockito.mock(HttpServletResponse.class);
        ByteArrayOutputStream secondOutput = captureOutput(secondResponse);
        servlet.processServiceRequest(session("second"), request("/" + fileName), secondResponse);

        Assertions.assertEquals("second data", secondOutput.toString(StandardCharsets.UTF_8));
        Assertions.assertFalse(Files.exists(secondFile));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "/../owner/file", "/..\\owner\\file", "/owner/file", "/owner\\file", "/nested/../file", "/.", "/..", "/"
    })
    public void rejectsPathsInsteadOfFileNames(String path) throws Exception {
        Path file = Files.createDirectories(exportFolder.resolve("owner")).resolve("file");
        Files.writeString(file, "owner data");
        HttpServletResponse response = Mockito.mock(HttpServletResponse.class);

        Assertions.assertThrows(DBWebException.class,
            () -> servlet.processServiceRequest(session("other"), request(path), response));

        Assertions.assertEquals("owner data", Files.readString(file));
        Mockito.verify(response, Mockito.never()).getOutputStream();
    }

    @Test
    public void doesNotServeFilesFromLegacySharedFolder() throws Exception {
        Path file = Files.writeString(exportFolder.resolve("file"), "legacy data");
        HttpServletResponse response = Mockito.mock(HttpServletResponse.class);

        Assertions.assertThrows(NoSuchFileException.class,
            () -> servlet.processServiceRequest(session("owner"), request("/file"), response));

        Assertions.assertEquals("legacy data", Files.readString(file));
        Mockito.verify(response, Mockito.never()).getOutputStream();
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    public void closingSessionRemovesUnclaimedExportsWithoutTouchingOtherSessions(boolean sendSessionExpiredEvent) throws Exception {
        TestWebSession owner = session("owner");
        TestWebSession other = session("other");
        String ownerFileName = createLobFile(owner, "owner data");
        String otherFileName = createLobFile(other, "other data");
        Path ownerFolder = exportFolder.resolve("owner");
        Files.writeString(ownerFolder.resolve("unclaimed"), "another export");
        TestSessionManager manager = new TestSessionManager(application);
        manager.add(owner);
        manager.add(other);

        Assertions.assertNotEquals(owner.getSessionId(), owner.getUserContext().getSmSessionId());
        Assertions.assertTrue(Files.exists(ownerFolder.resolve(ownerFileName)));
        Assertions.assertSame(owner, manager.closeSession(owner.getSessionId(), sendSessionExpiredEvent));

        Assertions.assertFalse(Files.exists(ownerFolder));
        Assertions.assertNull(manager.getSession(owner.getSessionId()));
        Assertions.assertSame(other, manager.getSession(other.getSessionId()));
        Assertions.assertEquals("other data", Files.readString(exportFolder.resolve("other").resolve(otherFileName)));
    }

    @Test
    public void closingSessionRemovesEmptyFolderAfterDownload() throws Exception {
        TestWebSession owner = session("owner");
        String fileName = createLobFile(owner, "owner data");
        HttpServletResponse response = Mockito.mock(HttpServletResponse.class);
        captureOutput(response);
        servlet.processServiceRequest(owner, request("/" + fileName), response);
        Assertions.assertTrue(Files.isDirectory(exportFolder.resolve("owner")));
        TestSessionManager manager = new TestSessionManager(application);
        manager.add(owner);

        manager.closeSession(owner.getSessionId());

        Assertions.assertFalse(Files.exists(exportFolder.resolve("owner")));
    }

    @Test
    public void expiringSessionRemovesItsFolderAndPreservesActiveSession() throws Exception {
        TestWebSession expired = session("expired");
        TestWebSession active = session("active");
        createLobFile(expired, "expired data");
        String activeFileName = createLobFile(active, "active data");
        TestSessionManager manager = new TestSessionManager(application);
        manager.add(expired);
        manager.add(active);
        expired.expire();
        Assertions.assertFalse(expired.isValid());
        Assertions.assertTrue(active.isValid());

        manager.expireIdleSessions();

        Assertions.assertFalse(Files.exists(exportFolder.resolve("expired")));
        Assertions.assertNull(manager.getSession(expired.getSessionId()));
        Assertions.assertSame(active, manager.getSession(active.getSessionId()));
        Assertions.assertEquals("active data", Files.readString(exportFolder.resolve("active").resolve(activeFileName)));
    }

    @Test
    public void inFlightExportCannotRecreateFolderAfterSessionCloses() throws Exception {
        TestWebSession owner = session("owner");
        createLobFile(owner, "owner data");
        WebSQLDataLOBReceiver receiver = createLobReceiver(owner, "late data");
        TestSessionManager manager = new TestSessionManager(application);
        manager.add(owner);

        manager.closeSession(owner.getSessionId());

        Assertions.assertThrows(IOException.class, () -> receiver.createLobFile(monitor));
        Assertions.assertFalse(Files.exists(exportFolder.resolve("owner")));
    }

    @Test
    public void closingSessionWithoutExportsDoesNotCreateFolder() throws Exception {
        TestWebSession owner = session("owner");
        TestSessionManager manager = new TestSessionManager(application);
        manager.add(owner);

        manager.closeSession(owner.getSessionId());
        owner.close();

        Assertions.assertFalse(Files.exists(exportFolder.resolve("owner")));
    }

    @NotNull
    private TestWebSession session(@NotNull String sessionId) throws DBException {
        return new TestWebSession(sessionId, application);
    }

    @NotNull
    private String createLobFile(@NotNull WebSession session, @NotNull String content) throws Exception {
        return createLobReceiver(session, content).createLobFile(monitor);
    }

    @NotNull
    private WebSQLDataLOBReceiver createLobReceiver(@NotNull WebSession session, @NotNull String content) throws Exception {
        Constructor<WebSQLDataLOBReceiver> constructor = WebSQLDataLOBReceiver.class.getDeclaredConstructor(
            WebSession.class, String.class, DBSDataContainer.class, int.class);
        constructor.setAccessible(true);
        WebSQLDataLOBReceiver receiver = constructor.newInstance(session, "table", Mockito.mock(DBSDataContainer.class), 0);
        DBDAttributeBindingMeta binding = Mockito.mock(DBDAttributeBindingMeta.class);
        Mockito.when(binding.getName()).thenReturn("column");
        setReceiverField(receiver, "binding", binding);
        setReceiverField(receiver, "value", content);
        return receiver;
    }

    private void setReceiverField(
        @NotNull WebSQLDataLOBReceiver receiver,
        @NotNull String name,
        @NotNull Object value
    ) throws ReflectiveOperationException {
        Field field = WebSQLCellValueReceiver.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(receiver, value);
    }

    @NotNull
    private HttpServletRequest request(@NotNull String path) {
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getMethod()).thenReturn("GET");
        Mockito.when(request.getPathInfo()).thenReturn(path);
        return request;
    }

    @NotNull
    private ByteArrayOutputStream captureOutput(@NotNull HttpServletResponse response) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Mockito.when(response.getOutputStream()).thenReturn(new ServletOutputStream() {
            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setWriteListener(WriteListener listener) {
            }

            @Override
            public void write(int value) {
                output.write(value);
            }
        });
        return output;
    }

    private static class TestWebSession extends WebSession {
        private TestWebSession(@NotNull String sessionId, @NotNull ServletApplication application) throws DBException {
            super(sessionId, "en", application, Map.of(), "127.0.0.1");
        }

        @NotNull
        @Override
        protected WebUserContext createUserContext() {
            WebUserContext context = Mockito.mock(WebUserContext.class);
            Mockito.when(context.getSmSessionId()).thenReturn("sm-" + getSessionId());
            return context;
        }

        private void expire() {
            lastAccessTime = 0;
        }
    }

    private static class TestSessionManager extends CBSessionManager {
        private TestSessionManager(@NotNull CBApplication<?> application) {
            super(application);
        }

        private void add(@NotNull WebSession session) {
            sessionMap.put(session.getSessionId(), session);
        }
    }

    private static class TestServlet extends WebSQLResultServlet {
        private TestServlet() {
            super(Mockito.mock(ServletApplication.class), Mockito.mock(DBWServiceSQL.class));
        }

        @Override
        public void processServiceRequest(
            @NotNull WebSession session,
            @NotNull HttpServletRequest request,
            @NotNull HttpServletResponse response
        ) throws DBException, IOException {
            super.processServiceRequest(session, request, response);
        }
    }
}

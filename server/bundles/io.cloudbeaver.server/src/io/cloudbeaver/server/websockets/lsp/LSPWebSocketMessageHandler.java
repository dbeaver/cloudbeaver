/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp
 *
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */
package io.cloudbeaver.server.websockets.lsp;

import io.cloudbeaver.model.session.BaseWebSession;
import jakarta.websocket.MessageHandler;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.lsp.DBLFacade;
import org.jkiss.dbeaver.model.lsp.DBLServerSessionProvider;

import java.io.*;
import java.nio.ByteBuffer;

public class LSPWebSocketMessageHandler implements MessageHandler.Whole<ByteBuffer>, AutoCloseable {
    private static final Log log = Log.getLog(LSPWebSocketMessageHandler.class);

    @NotNull
    private final PipedInputStream inputStream;
    @NotNull
    private final PipedOutputStream outputStream;

    public LSPWebSocketMessageHandler(@NotNull BaseWebSession session) {
        try {
            this.inputStream = new PipedInputStream(256 * 1024);
            this.outputStream = new PipedOutputStream(inputStream);
        } catch (IOException e) {
            throw new IllegalStateException("Can't create LSP piped streams", e);
        }
        DBLServerSessionProvider sessionProvider = new LSPWebServerSesssionProvider(session);
        Thread serverThread = new Thread(() -> runLanguageServer(sessionProvider), "LSP-WebSocket-" + session.getSessionId());
        serverThread.setDaemon(true);
        serverThread.start();
    }

    @Override
    public void onMessage(@NotNull ByteBuffer byteBuffer) {
        try {
            if (byteBuffer.hasArray()) {
                int offset = byteBuffer.arrayOffset() + byteBuffer.position();
                int len = byteBuffer.remaining();
                inputStream.read(byteBuffer.array(), offset, len);
            } else {
                byte[] chunk = new byte[byteBuffer.remaining()];
                byteBuffer.get(chunk);
                inputStream.read(chunk);
            }
            inputStream.reset();
        } catch (IOException e) {
            close();
        }
    }

    @Override
    public void close() {
        try {
            inputStream.close();
        } catch (IOException e) {
            log.debug("Error closing LSP input stream", e);
        }

        try {
            outputStream.close();
        } catch (IOException e) {
            log.debug("Error closing LSP output stream", e);
        }
    }

    private void runLanguageServer(@NotNull DBLServerSessionProvider sessionProvider) {
        try (InputStream in = inputStream; OutputStream out = outputStream) {
            DBLFacade.runLanguageServer(in, out, sessionProvider);
        } catch (Throwable e) {
            log.error("Error starting LSP server", e);
        } finally {
            close();
        }
    }
}

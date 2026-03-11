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
import jakarta.websocket.Session;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.lsp.DBLFacade;
import org.jkiss.dbeaver.model.lsp.DBLServerSessionProvider;

import java.io.*;
import java.nio.ByteBuffer;
import java.util.Objects;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class LSPWebSocketMessageHandler implements MessageHandler.Whole<ByteBuffer>, AutoCloseable {
    private static final Log log = Log.getLog(LSPWebSocketMessageHandler.class);

    private final Session wsSession;

    private final AtomicBoolean closed = new AtomicBoolean(false);
    private final ExecutorService ioExecutor = Executors.newFixedThreadPool(2, r -> {
        Thread t = new Thread(r, "lsp-ws-message-handler");
        t.setDaemon(true);
        return t;
    });

    private volatile PipedOutputStream wsToServer;
    private volatile PipedInputStream serverIn;

    private volatile PipedOutputStream serverOut;
    private volatile PipedInputStream serverToWs;

    public LSPWebSocketMessageHandler(@NotNull Session wsSession, @NotNull BaseWebSession webSession) {
        this.wsSession = Objects.requireNonNull(wsSession, "wsSession");

        DBLServerSessionProvider sessionProvider = new LSPWebServerSesssionProvider(webSession);
        runLanguageServer(sessionProvider);
    }

    @Override
    public void onMessage(@NotNull ByteBuffer byteBuffer) {
        if (closed.get()) {
            return;
        }
        if (wsToServer == null) {
            log.debug("LSP websocket message received before bridge initialization; ignoring");
            return;
        }

        try {
            if (byteBuffer.hasArray()) {
                int offset = byteBuffer.arrayOffset() + byteBuffer.position();
                int len = byteBuffer.remaining();
                wsToServer.write(byteBuffer.array(), offset, len);
                byteBuffer.position(byteBuffer.limit());
            } else {
                byte[] tmp = new byte[Math.min(byteBuffer.remaining(), 16 * 1024)];
                while (byteBuffer.hasRemaining()) {
                    int n = Math.min(byteBuffer.remaining(), tmp.length);
                    byteBuffer.get(tmp, 0, n);
                    wsToServer.write(tmp, 0, n);
                }
            }
            wsToServer.flush();
        } catch (IOException e) {
            if (!closed.get()) {
                log.error("Error forwarding websocket bytes to LSP server input stream", e);
                close();
            }
        }
    }

    @Override
    public void close() {
        if (!closed.compareAndSet(false, true)) {
            return;
        }

        try {
            if (wsToServer != null) {
                wsToServer.close();
            }
            if (serverToWs != null) {
                serverToWs.close();
            }
            if (serverIn != null) {
                serverIn.close();
            }
            if (serverOut != null) {
                serverOut.close();
            }
        } catch (IOException e) {
            log.debug("Error closing lspWs pipes", e);
        }
        ioExecutor.shutdownNow();
    }

    private void runLanguageServer(@NotNull DBLServerSessionProvider sessionProvider) {
        try {
            wsToServer = new PipedOutputStream();
            serverIn = new PipedInputStream(wsToServer, 64 * 1024);

            serverOut = new PipedOutputStream();
            serverToWs = new PipedInputStream(serverOut, 64 * 1024);

            ioExecutor.submit(() -> pumpToWebSocket(serverToWs));

            ioExecutor.submit(() -> {
                try (InputStream in = serverIn; OutputStream out = serverOut) {
                    DBLFacade.runLanguageServer(in, out, sessionProvider);
                } catch (Exception e) {
                    if (!closed.get()) {
                        log.error("LSP server terminated with an exception", e);
                    }
                } finally {
                    close();
                }
            });
        } catch (IOException e) {
            throw new IllegalStateException("Error initializing websocket <-> stream bridge", e);
        }
    }

    private void pumpToWebSocket(@NotNull InputStream in) {
        byte[] buf = new byte[16 * 1024];
        try {
            int n;
            while (!closed.get() && (n = in.read(buf)) >= 0) {
                if (n == 0) {
                    continue;
                }
                ByteBuffer payload = ByteBuffer.wrap(buf, 0, n);
                wsSession.getAsyncRemote().sendBinary(payload);
            }
        } catch (IOException e) {
            if (!closed.get()) {
                log.error("Error forwarding LSP server output stream to websocket", e);
            }
        } finally {
            close();
        }
    }
}

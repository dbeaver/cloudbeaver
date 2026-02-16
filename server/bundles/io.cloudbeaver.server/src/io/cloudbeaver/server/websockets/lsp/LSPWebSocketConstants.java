package io.cloudbeaver.server.websockets.lsp;

import java.time.Duration;

public class LSPWebSocketConstants {

    public static final String ENDPOINT_SUFFIX = "ws/lsp";
    public static final Duration IDLE_TIMEOUT = Duration.ofMinutes(5);

}

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
package io.cloudbeaver.server.websockets;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Bounded, one-use tickets stored in the HTTP session, never in a cookie.
 */
public final class CBWebSocketTickets {
    public static final String SESSION_ATTRIBUTE = CBWebSocketTickets.class.getName();
    public static final String TICKET_PARAMETER = "ticket";
    public static final String REQUEST_HEADER = "X-CB-WebSocket-Ticket";
    public static final String REQUEST_HEADER_VALUE = "request";

    private static final Duration LIFETIME = Duration.ofSeconds(30);
    private static final int MAX_TICKETS = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final Clock clock;
    private final Map<String, Long> tickets = new LinkedHashMap<>();

    public CBWebSocketTickets(@NotNull Clock clock) {
        this.clock = clock;
    }

    @NotNull
    public synchronized String issue() {
        long now = clock.millis();
        tickets.values().removeIf(expiresAt -> expiresAt <= now);
        while (tickets.size() >= MAX_TICKETS) {
            tickets.remove(tickets.keySet().iterator().next());
        }
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String ticket = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tickets.put(ticket, now + LIFETIME.toMillis());
        return ticket;
    }

    public synchronized boolean consume(@Nullable String ticket) {
        if (ticket == null) {
            return false;
        }
        Long expiresAt = tickets.remove(ticket);
        return expiresAt != null && expiresAt > clock.millis();
    }
}

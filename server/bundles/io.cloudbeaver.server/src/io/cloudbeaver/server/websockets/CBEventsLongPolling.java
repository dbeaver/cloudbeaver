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
package io.cloudbeaver.server.websockets;

import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.websocket.CBWebSessionEventHandler;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

public class CBEventsLongPolling implements CBWebSessionEventHandler {

    private static final Log log = Log.getLog(CBEventsLongPolling.class);

    private static final int QUEUE_CAPACITY = 1000;

    private final BaseWebSession webSession;
    private final BlockingQueue<WSEvent> queue = new LinkedBlockingQueue<>(QUEUE_CAPACITY);
    private final CBClientEventProcessor processor;
    private volatile long lastPoll;

    public CBEventsLongPolling(@NotNull BaseWebSession webSession) {
        this.webSession = webSession;
        this.lastPoll = System.currentTimeMillis();
        this.webSession.addEventHandler(this);
        this.processor = new CBClientEventProcessor(this.webSession);
    }

    @NotNull
    public BaseWebSession webSession() {
        return webSession;
    }

    public long lastPoll() {
        return lastPoll;
    }

    public void touch() {
        lastPoll = System.currentTimeMillis();
        webSession.touchSession();
    }

    @NotNull
    public List<WSEvent> pollEvents(long timeoutSec) throws InterruptedException {
        WSEvent first = queue.poll(timeoutSec, TimeUnit.SECONDS);
        if (first == null) {
            return List.of();
        }

        List<WSEvent> result = new ArrayList<>();
        result.add(first);
        queue.drainTo(result);
        return result;
    }

    @Override
    public void handleWebSessionEvent(@NotNull WSEvent event) {
        if (!queue.offer(event)) {
            log.warn("Event queue overflow: sid=" + webSession.getSessionId() +
                ", eventId=" + event.getId());
        }
    }

    public void onMessage(@Nullable String message) {
        processor.process(message);
    }

    @Override
    public void close() {
        webSession.removeEventHandler(this);
        queue.clear();
    }

    @Override
    public String toString() {
        return "CBEventsLongPolling{" +
            "sid=" + webSession.getSessionId() +
            ", size=" + queue.size() +
            ", lastPoll=" + lastPoll +
            '}';
    }

}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
package io.cloudbeaver.events;

import io.cloudbeaver.events.registry.CBEventHandlersRegistry;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CBEventController {
    private final Map<String, List<CBEventHandler>> eventHandlersByType = new HashMap<>();

    public CBEventController() {
        var eventHandlers = CBEventHandlersRegistry.getInstance().getEventHandlers();

        eventHandlers
            .forEach(handler -> eventHandlersByType.computeIfAbsent(handler.getSupportedEventType(), x -> new ArrayList<>()).add(handler));
    }

    private final List<CBEvent> eventsPool = new ArrayList<>();

    /**
     * Add cb event to the event pool
     */
    public void addEvent(@NotNull CBEvent event) {
        synchronized (eventsPool) {
            eventsPool.add(event);
        }
    }

    /**
     * Add cb event to the event pool
     */
    public void scheduleCheckJob() {
        new CBEventCheckJob().schedule();
    }

    private class CBEventCheckJob extends AbstractJob {
        private static final long CHECK_PERIOD = 1000;

        protected CBEventCheckJob() {
            super("CloudBeaver events job");
        }

        @Override
        protected IStatus run(DBRProgressMonitor monitor) {
            List<CBEvent> events;

            synchronized (eventsPool) {
                events = List.copyOf(eventsPool);
                eventsPool.clear();
            }
            if (events.isEmpty()) {
                schedule(CHECK_PERIOD);
                return Status.OK_STATUS;
            }
            for (CBEvent event : events) {
                eventHandlersByType.getOrDefault(event.getEventType(), List.of())
                    .forEach(handler -> handler.handleEvent(event));
            }
            schedule(CHECK_PERIOD);
            return Status.OK_STATUS;
        }
    }
}

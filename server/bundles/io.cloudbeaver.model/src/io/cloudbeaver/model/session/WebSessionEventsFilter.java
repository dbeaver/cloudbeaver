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

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.WSProjectResourceEvent;

import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

public class WebSessionEventsFilter {
    private final Set<String> subscribedEventTopics = new CopyOnWriteArraySet<>();
    private final Set<String> subscribedProjectIds = new CopyOnWriteArraySet<>();

    public void subscribeOnEventTopic(@Nullable String topic) {
        if (topic == null) {
            return;
        }
        subscribedEventTopics.add(topic);
    }

    public void unsubscribeFromEventTopic(@Nullable String topic) {
        if (topic == null) {
            return;
        }
        subscribedEventTopics.remove(topic);
    }

    public void setSubscribedProjects(@NotNull Set<String> subscribedProjectIds) {
        synchronized (this.subscribedProjectIds) {
            this.subscribedProjectIds.clear();
            this.subscribedProjectIds.addAll(subscribedProjectIds);
        }
    }

    public boolean isEventAllowed(WSEvent event) {
        if (event.isForceProcessed()) {
            return true;
        }
        if (!subscribedEventTopics.isEmpty() && !subscribedEventTopics.contains(event.getTopicId())
        ) {
            return false;
        }

        if (!subscribedProjectIds.isEmpty() && event instanceof WSProjectResourceEvent) {
            var projectEvent = (WSProjectResourceEvent) event;
            if (!subscribedProjectIds.contains(projectEvent.getProjectId())) {
                return false;
            }
        }

        return true;
    }
}

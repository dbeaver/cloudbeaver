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
package io.cloudbeaver.websocket;

import io.cloudbeaver.websocket.event.*;

/**
 * WebSocket event constants
 */
public interface WSConstants {
    //TODO: implement event registry and describe possible events in plugin.xml
    enum EventTopic {
        SERVER_CONFIG("cb_config"),
        DATASOURCE("cb_datasource"),
        DATASOURCE_FOLDER("cb_datasource_folder"),
        RM_SCRIPTS("cb_rm_scripts"),
        PROJECTS("cb_projects");

        private final String topicId;

        EventTopic(String topicId) {
            this.topicId = topicId;
        }

        public String getTopicId() {
            return topicId;
        }
    }

    enum Event {
        SERVER_CONFIG_CHANGED(
                "cb_config_changed",
                EventTopic.SERVER_CONFIG,
                WSServerConfigurationChangedEvent.class
        ),
        DATASOURCE_UPDATED("cb_datasource_updated", EventTopic.DATASOURCE, WSDataSourceUpdateEvent.class),
        DATASOURCE_FOLDER_UPDATED(
                "cb_datasource_folder_updated",
                EventTopic.DATASOURCE_FOLDER,
                WSDataSourceFolderUpdateEvent.class
        ),
        RM_RESOURCE_UPDATED("cb_rm_resource_updated", EventTopic.RM_SCRIPTS, WSResourceUpdatedEvent.class);

        private final String eventId;
        private final EventTopic topic;
        private final Class<? extends WSEvent> eventClass;


        Event(String eventId, EventTopic topic, Class<? extends WSEvent> eventClass) {
            this.eventId = eventId;
            this.topic = topic;
            this.eventClass = eventClass;
        }

        public String getEventId() {
            return eventId;
        }

        public EventTopic getTopic() {
            return topic;
        }

        public Class<? extends WSEvent> getEventClass() {
            return eventClass;
        }
    }

    enum EventAction {
        CREATE,
        DELETE,
        UPDATE
    }

    interface ClientEvents {
        String TOPIC_SUBSCRIBE = "cb_client_topic_subscribe";
        String TOPIC_UNSUBSCRIBE = "cb_client_topic_unsubscribe";
    }

    String CLOUDBEAVER_DATASOURCE_UPDATED = "cb_datasource_updated";
    String CLOUDBEAVER_DATASOURCE_FOLDER_UPDATED = "cb_datasource_folder_updated";
    String CLOUDBEAVER_RM_RESOURCE_UPDATED = "cb_rm_resource_updated";


}

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
        SERVER_CONFIG_CHANGED("cb_config_changed", EventTopic.SERVER_CONFIG),
        DATASOURCE_UPDATED("cb_datasource_updated", EventTopic.DATASOURCE),
        DATASOURCE_FOLDER_UPDATED("cb_datasource_folder_updated", EventTopic.DATASOURCE_FOLDER),
        RM_RESOURCE_UPDATED("cb_rm_resource_updated", EventTopic.RM_SCRIPTS);

        private final String eventId;
        private final EventTopic topic;


        Event(String eventId, EventTopic topic) {
            this.eventId = eventId;
            this.topic = topic;
        }

        public String getEventId() {
            return eventId;
        }

        public EventTopic getTopic() {
            return topic;
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

    String CLOUDBEAVER_DATASOURCE_UPDATED = "";
    String CLOUDBEAVER_DATASOURCE_FOLDER_UPDATED = "cb_datasource_folder_updated";
    String CLOUDBEAVER_RM_RESOURCE_UPDATED = "cb_rm_resource_updated";


}

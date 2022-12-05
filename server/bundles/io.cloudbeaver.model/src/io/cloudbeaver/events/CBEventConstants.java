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

/**
 * CB event constants
 */
public interface CBEventConstants {

    enum EventType {
        TYPE_CREATE,
        TYPE_DELETE,
        TYPE_UPDATE
    }

    String CLOUDBEAVER_CONFIG_CHANGED = "cb_config_changed";
    String CLOUDBEAVER_DATASOURCE_UPDATED = "cb_datasource_updated";
    String CLOUDBEAVER_DATASOURCE_FOLDER_UPDATED = "cb_datasource_folder_updated";
    String CLOUDBEAVER_RM_RESOURCE_UPDATED = "cb_rm_resource_updated";

    interface RMEvent {
        String PROJECT_ID = "projectId";
        String RESOURCE_PATH = "resourcePath";
        String RESOURCE_PARSED_PATH = "resourceParsedPath";
        String RM_EVENT_TYPE = "eventType";
    }

}

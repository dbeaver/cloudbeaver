/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.service.data.transfer.impl;

import java.util.HashMap;
import java.util.Map;

public class WebDataTransferSessionConfig {

    private final Map<String, WebDataTransferTaskConfig> tasks = new HashMap<>();

    public WebDataTransferSessionConfig() {
    }

    public WebDataTransferTaskConfig getTask(String dataFileId) {
        return tasks.get(dataFileId);
    }

    public void addTask(WebDataTransferTaskConfig taskConfig) {
        synchronized (tasks) {
            tasks.put(taskConfig.getDataFileId(), taskConfig);
        }
    }

    public WebDataTransferSessionConfig deleteExportFiles() {
        synchronized (tasks) {
            tasks.clear();
        }
        return this;
    }

}
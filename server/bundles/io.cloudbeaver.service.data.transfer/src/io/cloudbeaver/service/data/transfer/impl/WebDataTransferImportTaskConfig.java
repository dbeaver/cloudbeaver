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
package io.cloudbeaver.service.data.transfer.impl;

import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferProcessorDescriptor;

/**
 * A data import task config
 */
public class WebDataTransferImportTaskConfig {

    @NotNull
    private final String taskId;
    @NotNull
    private final WebSQLResultsInfo results;
    @NotNull
    private final DataTransferProcessorDescriptor processor;
    @NotNull
    private final WebDataTransferImportParameters parameters;

    public WebDataTransferImportTaskConfig(
        @NotNull String taskId,
        @NotNull WebSQLResultsInfo results,
        @NotNull DataTransferProcessorDescriptor processor,
        @NotNull WebDataTransferImportParameters parameters
    ) {
        this.taskId = taskId;
        this.results = results;
        this.processor = processor;
        this.parameters = parameters;
    }

    @NotNull
    public String getTaskId() {
        return taskId;
    }

    @NotNull
    public WebSQLResultsInfo getResults() {
        return results;
    }

    @NotNull
    public DataTransferProcessorDescriptor getProcessor() {
        return processor;
    }

    @NotNull
    public WebDataTransferImportParameters getParameters() {
        return parameters;
    }
}

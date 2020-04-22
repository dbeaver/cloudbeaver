/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
package io.cloudbeaver.service.data.transfer;

import io.cloudbeaver.api.DBWModel;
import io.cloudbeaver.server.model.WebAsyncTaskInfo;
import io.cloudbeaver.server.model.session.WebSession;
import org.jkiss.dbeaver.model.meta.RuntimeAction;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferProcessorDescriptor;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferRegistry;
import org.jkiss.dbeaver.tools.transfer.stream.StreamTransferConsumer;
import org.jkiss.utils.CommonUtils;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebDataTransferManager {

    private final DBWModel model;

    public WebDataTransferManager(DBWModel model) {
        this.model = model;
    }

    @RuntimeAction
    public List<WebDataTransferStreamProcessor> getAvailableStreamProcessors(WebSession session) {
        List<DataTransferProcessorDescriptor> processors = DataTransferRegistry.getInstance().getAvailableProcessors(StreamTransferConsumer.class, DBSEntity.class);
        if (CommonUtils.isEmpty(processors)) {
            return Collections.emptyList();
        }

        return processors.stream().map(x -> new WebDataTransferStreamProcessor(session, x)).collect(Collectors.toList());
    }

    @RuntimeAction
    public WebAsyncTaskInfo dataTransferExportDataFromContainer(
        WebSession session,
        String connectionId,
        String containerNodePath,
        WebDataTransferParameters parameters)
    {

        return null;
    }

    @RuntimeAction
    public WebAsyncTaskInfo dataTransferExportDataFromResults(
        WebSession session,
        String connectionId,
        String contextId,
        String resultsId,
        WebDataTransferParameters parameters)
    {
        return null;
    }

    @RuntimeAction
    public Boolean dataTransferRemoveDataFile(WebSession session, String dataFileId) {
        return true;
    }

    private WebDataTransferSessionConfig getConfig(WebSession session) {
        return session.getAttribute("dataTransfer", x -> new WebDataTransferSessionConfig());
    }
}

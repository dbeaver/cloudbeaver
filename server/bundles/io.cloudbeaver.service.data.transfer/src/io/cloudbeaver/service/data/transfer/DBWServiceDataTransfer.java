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
package io.cloudbeaver.service.data.transfer;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWService;
import io.cloudbeaver.service.data.transfer.impl.WebDataTransferDefaultExportSettings;
import io.cloudbeaver.service.data.transfer.impl.WebDataTransferParameters;
import io.cloudbeaver.service.data.transfer.impl.WebDataTransferStreamProcessor;
import io.cloudbeaver.service.data.transfer.impl.WebDataTransferTaskConfig;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.io.OutputStream;
import java.nio.file.Path;
import java.util.List;

/**
 * Web service implementation
 */
public interface DBWServiceDataTransfer extends DBWService {

    @WebAction
    List<WebDataTransferStreamProcessor> getAvailableStreamProcessors(WebSession session) throws DBWebException;

    @WebAction
    List<WebDataTransferStreamProcessor> getAvailableImportStreamProcessors(WebSession session) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo dataTransferExportDataFromContainer(
        WebSQLProcessor sqlProcessor,
        String containerNodePath,
        WebDataTransferParameters parameters) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo asyncImportDataContainer(
        @NotNull String processorId,
        @NotNull Path path,
        @NotNull WebSQLResultsInfo webSQLResultsInfo,
        @NotNull WebSession webSession) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo dataTransferExportDataFromResults(
        WebSQLContextInfo sqlContextInfo,
        String resultsId,
        WebDataTransferParameters parameters) throws DBWebException;

    /**
     * It's deprecated because now we use streaming file to response directly, and we don't need to clean up any files
     * after data transfer.
     */
    @WebAction
    @Deprecated
    Boolean dataTransferRemoveDataFile(WebSession session, String dataFileId) throws DBWebException;

    WebDataTransferDefaultExportSettings defaultExportSettings();

    /**
     * Usefully for exporting directly to http response and avoid to create temp files.
     */
    void exportDataTransferToStream(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebDataTransferTaskConfig taskConfig,
        @NotNull OutputStream outputStream
    ) throws DBException;
}

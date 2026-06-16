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
import org.jkiss.dbeaver.model.rm.RMConstants;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.io.OutputStream;
import java.nio.file.Path;
import java.util.List;

/**
 * Web service implementation
 */
public interface DBWServiceDataTransfer extends DBWService {

    @NotNull
    @WebAction
    List<WebDataTransferStreamProcessor> getAvailableStreamProcessors(@NotNull WebSession session) throws DBWebException;

    @NotNull
    @WebAction
    List<WebDataTransferStreamProcessor> getAvailableImportStreamProcessors(@NotNull WebSession session) throws DBWebException;

    @NotNull
    @WebAction(requireGlobalPermissions = RMConstants.PERMISSION_DATA_EDITOR_EXPORT)
    WebAsyncTaskInfo dataTransferExportDataFromContainer(
        @NotNull WebSQLProcessor sqlProcessor,
        @NotNull String containerNodePath,
        @NotNull WebDataTransferParameters parameters
    ) throws DBWebException;

    @NotNull
    @WebAction
    WebAsyncTaskInfo asyncImportDataContainer(
        @NotNull String processorId,
        @NotNull Path path,
        @NotNull WebSQLResultsInfo webSQLResultsInfo,
        @NotNull WebSession webSession) throws DBWebException;

    @NotNull
    @WebAction(requireGlobalPermissions = RMConstants.PERMISSION_DATA_EDITOR_EXPORT)
    WebAsyncTaskInfo dataTransferExportDataFromResults(
        @NotNull WebSQLContextInfo sqlContextInfo,
        @NotNull String resultsId,
        @NotNull WebDataTransferParameters parameters
    ) throws DBWebException;

    /**
     * It's deprecated because now we use streaming file to response directly, and we don't need to clean up any files
     * after data transfer.
     */
    @NotNull
    @WebAction
    @Deprecated
    Boolean dataTransferRemoveDataFile(@NotNull WebSession session, @NotNull String dataFileId) throws DBWebException;

    @NotNull
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

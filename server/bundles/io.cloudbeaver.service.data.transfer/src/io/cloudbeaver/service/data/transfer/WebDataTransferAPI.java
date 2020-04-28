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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.api.DBWServiceAPI;
import io.cloudbeaver.api.WebAction;
import io.cloudbeaver.server.model.WebAsyncTaskInfo;
import io.cloudbeaver.server.model.session.WebSession;
import io.cloudbeaver.server.model.sql.WebSQLContextInfo;
import io.cloudbeaver.server.model.sql.WebSQLProcessor;

import java.util.List;

/**
 * Web service implementation
 */
public interface WebDataTransferAPI extends DBWServiceAPI {

    @WebAction
    List<WebDataTransferStreamProcessor> getAvailableStreamProcessors(WebSession session) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo dataTransferExportDataFromContainer(
        WebSQLProcessor sqlProcessor,
        String containerNodePath,
        WebDataTransferParameters parameters) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo dataTransferExportDataFromResults(
        WebSQLContextInfo sqlContextInfo,
        String resultsId,
        WebDataTransferParameters parameters) throws DBWebException;

    @WebAction
    Boolean dataTransferRemoveDataFile(WebSQLProcessor sqlProcessor, String dataFileId) throws DBWebException;

}

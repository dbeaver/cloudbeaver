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

import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;

public class WebDataTransferTaskConfig {

    private static final Log log = Log.getLog(WebDataTransferTaskConfig.class);

    private String fileNameKey;
    private WebDataTransferParameters parameters;
    private String exportFileName;
    private DBSDataContainer dataContainer;
    private WebSQLResultsInfo resultsInfo;

    public WebDataTransferTaskConfig(
        String fileNameKey,
        WebDataTransferParameters parameters,
        String exportFileName,
        DBSDataContainer dataContainer,
        WebSQLResultsInfo webSQLResultsInfo
    ) {
        this.fileNameKey = fileNameKey;
        this.parameters = parameters;
        this.exportFileName = exportFileName;
        this.dataContainer = dataContainer;
        this.resultsInfo = webSQLResultsInfo;
    }

    public String getDataFileId() {
        return fileNameKey;
    }

    public WebDataTransferParameters getParameters() {
        return parameters;
    }

    public String getExportFileName() {
        return exportFileName;
    }

    public DBSDataContainer getDataContainer() {
        return dataContainer;
    }

    public WebSQLResultsInfo getResultsInfo() {
        return resultsInfo;
    }
}
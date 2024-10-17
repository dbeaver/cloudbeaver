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
package io.cloudbeaver.service.data.transfer.impl;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class WebDataTransferTaskConfig {

    private static final Log log = Log.getLog(WebDataTransferTaskConfig.class);

    @NotNull
    private final Path dataFile;
    @NotNull
    private final WebDataTransferParameters parameters;
    @Nullable
    private String exportFileName;

    public WebDataTransferTaskConfig(@NotNull Path dataFile, @NotNull WebDataTransferParameters parameters) {
        this.dataFile = dataFile;
        this.parameters = parameters;
    }

    @NotNull
    public Path getDataFile() {
        return dataFile;
    }

    @NotNull
    public String getDataFileId() {
        return dataFile.getFileName().toString();
    }

    @NotNull
    public WebDataTransferParameters getParameters() {
        return parameters;
    }

    @Nullable
    public String getExportFileName() {
        return exportFileName;
    }

    public void setExportFileName(@NotNull String exportFileName) {
        this.exportFileName = exportFileName;
    }

    public void deleteFile() {
        try {
            Files.delete(dataFile);
        } catch (IOException e) {
            log.error("Error deleting export file " + dataFile.toAbsolutePath(), e);
        }
    }
}
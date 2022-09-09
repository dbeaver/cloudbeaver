package io.cloudbeaver.service.data.transfer.impl;

import org.jkiss.dbeaver.Log;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class WebDataTransferTaskConfig {

    private static final Log log = Log.getLog(WebDataTransferTaskConfig.class);

    private Path dataFile;
    private WebDataTransferParameters parameters;
    private String exportFileName;

    public WebDataTransferTaskConfig(Path dataFile, WebDataTransferParameters parameters) {
        this.dataFile = dataFile;
        this.parameters = parameters;
    }

    public Path getDataFile() {
        return dataFile;
    }

    public String getDataFileId() {
        return dataFile.getFileName().toString();
    }

    public WebDataTransferParameters getParameters() {
        return parameters;
    }

    public String getExportFileName() {
        return exportFileName;
    }

    public void setExportFileName(String exportFileName) {
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
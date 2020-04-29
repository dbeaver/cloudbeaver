package io.cloudbeaver.service.data.transfer.impl;

import org.jkiss.dbeaver.Log;

import java.io.File;

public class WebDataTransferTaskConfig {

    private static final Log log = Log.getLog(WebDataTransferTaskConfig.class);

    private File dataFile;
    private WebDataTransferParameters parameters;
    private String exportFileName;

    public WebDataTransferTaskConfig(File dataFile, WebDataTransferParameters parameters) {
        this.dataFile = dataFile;
        this.parameters = parameters;
    }

    public File getDataFile() {
        return dataFile;
    }

    public String getDataFileId() {
        return dataFile.getName();
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
        if (!dataFile.delete()) {
            log.error("Error deleting export file " + dataFile.getAbsolutePath());
        }
    }
}
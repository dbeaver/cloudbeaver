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

    public void removeTask(WebDataTransferTaskConfig taskConfig) {
        synchronized (tasks) {
            tasks.remove(taskConfig.getDataFileId());
            taskConfig.deleteFile();
        }
    }

    public WebDataTransferSessionConfig deleteExportFiles() {
        synchronized (tasks) {
            tasks.values().forEach(WebDataTransferTaskConfig::deleteFile);
            tasks.clear();
        }
        return this;
    }

}
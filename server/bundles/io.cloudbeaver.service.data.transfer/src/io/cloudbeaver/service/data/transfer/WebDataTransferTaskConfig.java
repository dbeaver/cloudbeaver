package io.cloudbeaver.service.data.transfer;

import org.jkiss.dbeaver.tools.transfer.registry.DataTransferProcessorDescriptor;

import java.util.Map;

public class WebDataTransferTaskConfig {

    private String dataFileId;
    private DataTransferProcessorDescriptor processor;
    private Map<String, Object> settings;
    private Map<String, Object> processorProperties;

}
package io.cloudbeaver.service.data.transfer.impl;

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferProcessorDescriptor;
import org.jkiss.utils.CommonUtils;

class WebDataTransferUtils {

    private static final Log log = Log.getLog(WebDataTransferUtils.class);


    public static String getProcessorFileExtension(DataTransferProcessorDescriptor processor) {
        DBPPropertyDescriptor extProperty = processor.getProperty("extension");
        String ext = extProperty == null ? processor.getAppFileExtension() : CommonUtils.toString(extProperty.getDefaultValue(), null);
        return CommonUtils.isEmpty(ext) ? "data" : ext;
    }

    public static WebDataTransferSessionConfig getSessionDataTransferConfig(WebSession session) {
        return session.getAttribute("dataTransfer", x -> new WebDataTransferSessionConfig(), WebDataTransferSessionConfig::deleteExportFiles);
    }
}
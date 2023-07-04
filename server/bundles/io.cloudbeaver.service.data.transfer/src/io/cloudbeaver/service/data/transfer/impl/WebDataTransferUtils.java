/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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

    public static String getResultTaskFileExtension(
        DataTransferProcessorDescriptor processor,
        WebDataTransferOutputSettings outputSettings
    ) {
        String processorExt = getProcessorFileExtension(processor);
        return outputSettings.isCompress() ? processorExt + ".zip" : processorExt;
    }

    public static WebDataTransferSessionConfig getSessionDataTransferConfig(WebSession session) {
        return session.getAttribute("dataTransfer", x -> new WebDataTransferSessionConfig(), WebDataTransferSessionConfig::deleteExportFiles);
    }
}
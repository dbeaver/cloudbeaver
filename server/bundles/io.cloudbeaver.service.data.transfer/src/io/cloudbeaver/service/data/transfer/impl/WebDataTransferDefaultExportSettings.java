/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import org.jkiss.dbeaver.tools.transfer.stream.StreamConsumerSettings;

import java.nio.charset.Charset;
import java.util.Set;

public class WebDataTransferDefaultExportSettings {
    private final WebDataTransferOutputSettings outputSettings;
    private final Set<String> supportedEncodings;

    public WebDataTransferDefaultExportSettings() {
        var defConsumerSettings = new StreamConsumerSettings();
        this.outputSettings = new WebDataTransferOutputSettings(
            false,
            defConsumerSettings.getOutputEncoding(),
            defConsumerSettings.getOutputTimestampPattern()
        );
        this.supportedEncodings = Charset.availableCharsets().keySet();
    }

    public WebDataTransferOutputSettings getOutputSettings() {
        return outputSettings;
    }

    public Set<String> getSupportedEncodings() {
        return supportedEncodings;
    }
}

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

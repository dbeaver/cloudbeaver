package io.cloudbeaver.service.data.transfer.impl;

import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferProcessorDescriptor;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class WebDataTransferStreamProcessor {

    private final WebSession session;
    private final DataTransferProcessorDescriptor processor;

    public WebDataTransferStreamProcessor(WebSession session, DataTransferProcessorDescriptor processor) {
        this.session = session;
        this.processor = processor;
    }

    @Property
    public String getId() {
        return processor.getFullId();
    }

    @Property
    public String getName() {
        return processor.getName();
    }

    @Property
    public String getDescription() {
        return processor.getDescription();
    }

    @Property
    public String getFileExtension() {
        return WebDataTransferUtils.getProcessorFileExtension(processor);
    }

    @Property
    public String getAppFileExtension() {
        return processor.getAppFileExtension();
    }

    @Property
    public String getAppName() {
        return processor.getAppName();
    }

    @Property
    public int getOrder() {
        return processor.getOrder();
    }

    @Property
    @NotNull
    public String getIcon() {
        return processor.getIcon().getLocation();
    }

    @Property
    public List<WebPropertyInfo> getProperties() {
        return Arrays.stream(processor.getProperties()).map(x -> new WebPropertyInfo(session, x)).collect(Collectors.toList());
    }

    @Property
    public boolean isBinaryFormat() {
        return processor.isBinaryFormat();
    }

    @Property
    public boolean isHTMLFormat() {
        return processor.isHTMLFormat();
    }

}
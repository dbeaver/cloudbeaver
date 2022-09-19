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
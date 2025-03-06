/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebAsyncTaskProcessor;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.data.transfer.DBWServiceDataTransfer;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.struct.DBSDataManipulator;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.DBSObjectContainer;
import org.jkiss.dbeaver.tools.transfer.IDataTransferConsumer;
import org.jkiss.dbeaver.tools.transfer.IDataTransferProcessor;
import org.jkiss.dbeaver.tools.transfer.database.*;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferProcessorDescriptor;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferRegistry;
import org.jkiss.dbeaver.tools.transfer.stream.*;
import org.jkiss.dbeaver.utils.ContentUtils;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.InvocationTargetException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceDataTransfer implements DBWServiceDataTransfer {

    private static final Log log = Log.getLog(WebServiceDataTransfer.class);

    private final Path dataExportFolder;

    public WebServiceDataTransfer() {
        dataExportFolder = CBPlatform.getInstance().getTempFolder(new VoidProgressMonitor(), "data-transfer");

        ContentUtils.deleteFileRecursive(dataExportFolder);
        try {
            Files.createDirectories(dataExportFolder);
        } catch (IOException e) {
            log.error("Error re-creating temporary folder", e);
        }
    }

    @Override
    public List<WebDataTransferStreamProcessor> getAvailableStreamProcessors(WebSession session) {
        List<DataTransferProcessorDescriptor> processors = DataTransferRegistry.getInstance()
                .getAvailableProcessors(StreamTransferConsumer.class, DBSEntity.class);
        if (CommonUtils.isEmpty(processors)) {
            return Collections.emptyList();
        }

        return processors.stream().map(x -> new WebDataTransferStreamProcessor(session, x)).collect(Collectors.toList());
    }

    @Override
    public List<WebDataTransferStreamProcessor> getAvailableImportStreamProcessors(WebSession session) {
        List<DataTransferProcessorDescriptor> processors =
                DataTransferRegistry.getInstance().getAvailableProcessors(StreamTransferProducer.class, DBSEntity.class);
        if (CommonUtils.isEmpty(processors)) {
            return Collections.emptyList();
        }

        return processors.stream().map(x -> new WebDataTransferStreamProcessor(session, x)).collect(Collectors.toList());
    }

    @Override
    public WebAsyncTaskInfo dataTransferExportDataFromContainer(
        WebSQLProcessor sqlProcessor,
        String containerNodePath,
        WebDataTransferParameters parameters) throws DBWebException {

        DBSDataContainer dataContainer;
        try {
            dataContainer = sqlProcessor.getDataContainerByNodePath(sqlProcessor.getWebSession().getProgressMonitor(), containerNodePath, DBSDataContainer.class);
        } catch (DBException e) {
            throw new DBWebException("Invalid node path: " + containerNodePath, e);
        }

        return asyncExportFromDataContainer(sqlProcessor, parameters, dataContainer, null);
    }

    @NotNull
    private String makeUniqueFileName(
            WebSQLProcessor sqlProcessor,
            DataTransferProcessorDescriptor processor,
            Map<String, Object> processorProperties
    ) {
        if (processorProperties != null && processorProperties.get(StreamConsumerSettings.PROP_FILE_EXTENSION) != null) {
            return sqlProcessor.getWebSession().getSessionId() + "_" + UUID.randomUUID() +
                    "." + processorProperties.get(StreamConsumerSettings.PROP_FILE_EXTENSION);
        }
        return sqlProcessor.getWebSession().getSessionId() + "_" + UUID.randomUUID() + "." + WebDataTransferUtils.getProcessorFileExtension(processor);
    }

    @Override
    public WebAsyncTaskInfo dataTransferExportDataFromResults(
        WebSQLContextInfo sqlContext,
        String resultsId,
        WebDataTransferParameters parameters) throws DBWebException {

        WebSQLResultsInfo results = sqlContext.getResults(resultsId);

        return asyncExportFromDataContainer(sqlContext.getProcessor(), parameters, results.getDataContainer(), results);
    }

    @Override
    public WebDataTransferDefaultExportSettings defaultExportSettings() {
        return new WebDataTransferDefaultExportSettings();
    }

    @Override
    @Deprecated
    public Boolean dataTransferRemoveDataFile(WebSession webSession, String dataFileId) throws DBWebException {
        //deprecated
        return true;
    }

    @Override
    public void exportDataTransferToStream(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebDataTransferTaskConfig taskConfig,
        @NotNull OutputStream outputStream
    ) throws DBException {

        WebDataTransferParameters parameters = taskConfig.getParameters();
        DBSDataContainer dataContainer = taskConfig.getDataContainer();
        WebSQLResultsInfo resultsInfo = taskConfig.getResultsInfo();
        DataTransferProcessorDescriptor processor = DataTransferRegistry.getInstance().getProcessor(parameters.getProcessorId());

        try {
            exportData(monitor, processor, dataContainer, parameters, resultsInfo, outputStream);
        } catch (Exception e) {
            throw new DBException("Error exporting data", e);
        }
    }

    private WebAsyncTaskInfo asyncExportFromDataContainer(
        @NotNull WebSQLProcessor sqlProcessor,
        @NotNull WebDataTransferParameters parameters,
        @NotNull DBSDataContainer dataContainer,
        @Nullable WebSQLResultsInfo resultsInfo
    ) {
        sqlProcessor.getWebSession().addInfoMessage("Export data");
        DataTransferProcessorDescriptor processor = DataTransferRegistry.getInstance().getProcessor(parameters.getProcessorId());
        String uniqueFileName = makeUniqueFileName(sqlProcessor, processor, parameters.getProcessorProperties());
        var outputSettings = parameters.getOutputSettings();
        String fileNameKey = WebDataTransferUtils.normalizeFileName(uniqueFileName, outputSettings);
        String exportFileName = CommonUtils.isEmpty(outputSettings.getFileName())
                                ? CommonUtils.escapeFileName(CommonUtils.truncateString(dataContainer.getName(), 32))
                                : outputSettings.getFileName();
        WebDataTransferTaskConfig taskConfig = new WebDataTransferTaskConfig(
            fileNameKey, parameters, exportFileName, dataContainer, resultsInfo);

        WebDataTransferUtils.getSessionDataTransferConfig(sqlProcessor.getWebSession())
            .addTask(taskConfig);

        //fixme fake task for keeping api
        return sqlProcessor.getWebSession().createAndRunAsyncTask(
            "Data export", new WebAsyncTaskProcessor<>() {
                @Override
                public void run(DBRProgressMonitor monitor) throws InvocationTargetException {
                    result = fileNameKey;
                }
            }
        );
    }

    public WebAsyncTaskInfo asyncImportDataContainer(@NotNull String processorId,
                                                     @NotNull Path path,
                                                     @NotNull WebSQLResultsInfo sqlContext,
                                                     @NotNull WebSession webSession) throws DBWebException {
        webSession.addInfoMessage("Import data");
        DataTransferProcessorDescriptor processor = DataTransferRegistry.getInstance().getProcessor(processorId);

        DBSDataContainer dataContainer = sqlContext.getDataContainer();
        WebAsyncTaskProcessor<String> runnable = new WebAsyncTaskProcessor<>() {
            @Override
            public void run(DBRProgressMonitor monitor) throws InvocationTargetException {
                monitor.beginTask("Import data", 1);
                try {
                    monitor.subTask("Import data using " + processor.getName());
                    try {
                        importData(monitor, processor, (DBSDataManipulator) dataContainer, path);
                    } catch (Exception e) {
                        if (e instanceof DBException) {
                            throw e;
                        }
                        throw new DBException("Error importing data", e);
                    }
                } catch (Throwable e) {
                    throw new InvocationTargetException(e);
                } finally {
                    try {
                        Files.deleteIfExists(path);
                    } catch (IOException e) {
                        log.error("Failed to delete file: " + e.getMessage(), e);
                    }
                    monitor.done();
                }
            }
        };
        return webSession.createAndRunAsyncTask("Data import", runnable);
    }

    private void exportData(
        DBRProgressMonitor monitor,
        DataTransferProcessorDescriptor processor,
        DBSDataContainer dataContainer,
        WebDataTransferParameters parameters,
        WebSQLResultsInfo resultsInfo,
        OutputStream outputStream
    ) throws DBException, IOException {
        IDataTransferProcessor processorInstance = processor.getInstance();
        if (!(processorInstance instanceof IStreamDataExporter exporter)) {
            throw new DBException("Invalid processor. " + IStreamDataExporter.class.getSimpleName() + " expected");
        }

        Map<String, Object> processorProperties = parameters.getProcessorProperties();
        if (processorProperties == null) processorProperties = Collections.emptyMap();
        Map<String, Object> properties = new HashMap<>();
        for (DBPPropertyDescriptor prop : processor.getProperties()) {
            Object propValue = processorProperties.get(CommonUtils.toString(prop.getId()));
            properties.put(prop.getId(), propValue != null ? propValue : prop.getDefaultValue());
        }
        // Remove extension property (we specify file name directly)
        properties.remove(StreamConsumerSettings.PROP_FILE_EXTENSION);

        DatabaseProducerSettings producerSettings = new DatabaseProducerSettings();
        producerSettings.setExtractType(DatabaseProducerSettings.ExtractType.SINGLE_QUERY);
        producerSettings.setQueryRowCount(false);
        producerSettings.setOpenNewConnections(CommonUtils.getOption(parameters.getDbProducerSettings(), "openNewConnection"));
        StreamTransferConsumer consumer = new StreamTransferConsumer();
        StreamConsumerSettings settings = makeStreamConsumerSettings(parameters);
        DatabaseTransferProducer producer = new DatabaseTransferProducer(
            dataContainer,
            parameters.getFilter() == null ? null : parameters.getFilter().makeDataFilter(resultsInfo));

        consumer.initTransfer(
            dataContainer,
            settings,
            new IDataTransferConsumer.TransferParameters(processor.isBinaryFormat(), processor.isHTMLFormat(), outputStream),
            exporter,
            properties,
            producer.getProject());

        producer.transferData(monitor, consumer, null, producerSettings, null);

        consumer.finishTransfer(monitor, false);
    }

    @NotNull
    private StreamConsumerSettings makeStreamConsumerSettings(@NotNull WebDataTransferParameters parameters) {
        StreamConsumerSettings settings = new StreamConsumerSettings();

        WebDataTransferOutputSettings outputSettings = parameters.getOutputSettings();
        settings.setOutputEncodingBOM(outputSettings.isInsertBom());
        settings.setCompressResults(outputSettings.isCompress());
        if (!CommonUtils.isEmpty(outputSettings.getEncoding())) {
            settings.setOutputEncoding(outputSettings.getEncoding());
        }
        if (!CommonUtils.isEmpty(outputSettings.getTimestampPattern())) {
            settings.setOutputTimestampPattern(outputSettings.getTimestampPattern());
        }
        return settings;
    }

    private void importData(
            DBRProgressMonitor monitor,
            DataTransferProcessorDescriptor processor,
            @NotNull DBSDataManipulator dataContainer,
            Path path) throws DBException {
        IDataTransferProcessor processorInstance = processor.getInstance();

        StreamTransferProducer producer;
        if (dataContainer.getDataSource() != null) {
            producer = new StreamTransferProducer(new StreamEntityMapping(path), processor);

            DatabaseTransferConsumer consumer = new DatabaseTransferConsumer(dataContainer);
            DatabaseConsumerSettings databaseConsumerSettings = new DatabaseConsumerSettings();
            databaseConsumerSettings.setContainer((DBSObjectContainer) dataContainer.getDataSource());
            consumer.setSettings(databaseConsumerSettings);

            StreamProducerSettings producerSettings = new StreamProducerSettings();
            Map<String, Object> properties = new HashMap<>();
            for (DBPPropertyDescriptor prop : processor.getProperties()) {
                properties.put(prop.getId(), prop.getDefaultValue());
            }
            producerSettings.setProcessorProperties(properties);
            producerSettings.updateProducerSettingsFromStream(
                    monitor,
                    producer,
                    processorInstance,
                    properties);
            DatabaseMappingContainer databaseMappingContainer =
                new DatabaseMappingContainer(monitor, databaseConsumerSettings, producer.getDatabaseObject(), consumer.getTargetObject());
            databaseMappingContainer.getAttributeMappings(monitor);
            databaseMappingContainer.setTarget(dataContainer);
            consumer.setContainerMapping(databaseMappingContainer);
            try {
                producer.transferData(monitor, consumer, processorInstance, producerSettings, null);
                if (monitor.isCanceled()) {
                    throw new DBWebException("Import is canceled");
                }
            } catch (DBException e) {
                throw new DBWebException("Import failed cause: " + e.getMessage());
            }
        }
    }

}

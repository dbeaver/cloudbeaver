/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebAsyncTaskProcessor;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.service.data.transfer.DBWServiceDataTransfer;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourcePermission;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.struct.DBSDataManipulator;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.DBSObjectContainer;
import org.jkiss.dbeaver.tools.transfer.DTConstants;
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

    @NotNull
    @Override
    public List<WebDataTransferStreamProcessor> getAvailableStreamProcessors(@NotNull WebSession session) {
        List<DataTransferProcessorDescriptor> processors = DataTransferRegistry.getInstance()
                .getAvailableProcessors(StreamTransferConsumer.class, DBSEntity.class);
        if (CommonUtils.isEmpty(processors)) {
            return Collections.emptyList();
        }

        return processors.stream().map(x -> new WebDataTransferStreamProcessor(session, x)).collect(Collectors.toList());
    }

    @NotNull
    @Override
    public List<WebDataTransferStreamProcessor> getAvailableImportStreamProcessors(@NotNull WebSession session) {
        List<DataTransferProcessorDescriptor> processors =
                DataTransferRegistry.getInstance().getAvailableProcessors(StreamTransferProducer.class, DBSEntity.class);
        if (CommonUtils.isEmpty(processors)) {
            return Collections.emptyList();
        }

        return processors.stream().map(x -> new WebDataTransferStreamProcessor(session, x)).collect(Collectors.toList());
    }

    @NotNull
    @Override
    public WebAsyncTaskInfo dataTransferExportDataFromContainer(
        @NotNull WebSQLProcessor sqlProcessor,
        @NotNull String containerNodePath,
        @NotNull WebDataTransferParameters parameters
    ) throws DBWebException {
        if (!validateExportPermission(sqlProcessor.getWebSession())) {
            throw new DBWebException("Data export was disabled by administrator");
        }
        DBSDataContainer dataContainer;
        try {
            dataContainer = sqlProcessor.getDataContainerByNodePath(sqlProcessor.getWebSession().getProgressMonitor(), containerNodePath, DBSDataContainer.class);
        } catch (DBException e) {
            throw new DBWebException("Invalid node path: " + containerNodePath, e);
        }

        return asyncExportFromDataContainer(sqlProcessor, parameters, dataContainer, null);
    }

    private boolean validateExportPermission(@NotNull WebSession webSession) {
        if (!WebAppUtils.getWebApplication().isCommunity()) {
            // global permission is already checked
            return true;
        }
        Map<String, Object> productSettings = WebAppUtils.getWebApplication().getServerConfiguration().getProductSettings();
        // we need to check in product settings
        // product settings parameter saves only disabled state that's why we invert result
        return webSession.hasPermission(DBWConstants.PERMISSION_ADMIN) ||
            !CommonUtils.getOption(productSettings, CBConstants.PREF_DATA_EDITOR_EXPORT_DISABLED_OLD, false);
    }

    @NotNull
    private String makeUniqueFileName(
        @NotNull WebSQLProcessor sqlProcessor,
        @NotNull DataTransferProcessorDescriptor processor,
        @Nullable Map<String, Object> processorProperties
    ) {
        if (processorProperties != null && processorProperties.get(StreamConsumerSettings.PROP_FILE_EXTENSION) != null) {
            return sqlProcessor.getWebSession().getSessionId() + "_" + UUID.randomUUID() +
                    "." + processorProperties.get(StreamConsumerSettings.PROP_FILE_EXTENSION);
        }
        return sqlProcessor.getWebSession().getSessionId() + "_" + UUID.randomUUID() + "." + WebDataTransferUtils.getProcessorFileExtension(processor);
    }

    @NotNull
    @Override
    public WebAsyncTaskInfo dataTransferExportDataFromResults(
        @NotNull WebSQLContextInfo sqlContext,
        @NotNull String resultsId,
        @NotNull WebDataTransferParameters parameters
    ) throws DBWebException {
        if (!validateExportPermission(sqlContext.getProcessor().getWebSession())) {
            throw new DBWebException("Data export was disabled by administrator");
        }
        WebSQLResultsInfo results = sqlContext.getResults(resultsId);

        return asyncExportFromDataContainer(sqlContext.getProcessor(), parameters, results.getDataContainer(), results);
    }

    @NotNull
    @Override
    public WebDataTransferDefaultExportSettings defaultExportSettings() {
        return new WebDataTransferDefaultExportSettings();
    }

    @NotNull
    @Override
    @Deprecated
    public Boolean dataTransferRemoveDataFile(@NotNull WebSession webSession, @NotNull String dataFileId) throws DBWebException {
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
        if (processor == null) {
            throw new DBException("Wrong data processor '" + parameters.getProcessorId() + "'");
        }
        try {
            exportData(monitor, processor, dataContainer, parameters, resultsInfo, outputStream);
        } catch (Exception e) {
            throw new DBException("Error exporting data", e);
        }
    }

    @NotNull
    private WebAsyncTaskInfo asyncExportFromDataContainer(
        @NotNull WebSQLProcessor sqlProcessor,
        @NotNull WebDataTransferParameters parameters,
        @NotNull DBSDataContainer dataContainer,
        @Nullable WebSQLResultsInfo resultsInfo
    ) throws DBWebException {
        sqlProcessor.getWebSession().addInfoMessage("Export data");
        log.info(String.format("Data export started: [userId=%s]", sqlProcessor.getWebSession().getUserId()));

        DataTransferProcessorDescriptor processor = DataTransferRegistry.getInstance().getProcessor(parameters.getProcessorId());
        if (processor == null) {
            throw new DBWebException("Wrong data processor '" + parameters.getProcessorId() + "'");
        }
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

    @NotNull
    @Override
    public WebAsyncTaskInfo asyncImportDataContainer(
        @NotNull WebSQLContextInfo sqlContext,
        @NotNull String resultsId,
        @NotNull WebDataTransferImportParameters parameters,
        @NotNull WebSession webSession
    ) throws DBWebException {
        if (!validateImportPermission(webSession)) {
            throw new DBWebException("Permission denied. Data import is not allowed for this user");
        }
        if (!sqlContext.getProcessor().getConnection().getDataSourceContainer()
            .hasModifyPermission(DBPDataSourcePermission.PERMISSION_IMPORT_DATA)) {
            throw new DBWebException("Data import is restricted for this connection");
        }
        DataTransferProcessorDescriptor processor = DataTransferRegistry.getInstance().getProcessor(parameters.getProcessorId());
        if (processor == null) {
            throw new DBWebException("Wrong data processor '" + parameters.getProcessorId() + "'");
        }
        WebSQLResultsInfo results = sqlContext.getResults(resultsId);
        if (!(results.getDataContainer() instanceof DBSDataManipulator)) {
            throw new DBWebException("Results '" + resultsId + "' do not support data import");
        }

        // The task is created but not started: it is executed once the file is uploaded for this task id
        WebAsyncTaskInfo taskInfo = webSession.createAsyncTask("Data import");
        WebDataTransferUtils.getSessionDataTransferConfig(webSession)
            .addImportTask(new WebDataTransferImportTaskConfig(taskInfo.getId(), results, processor, parameters));
        return taskInfo;
    }

    @NotNull
    @Override
    public WebAsyncTaskInfo runImportDataTask(
        @NotNull WebSession webSession,
        @NotNull String taskId,
        @NotNull Path path
    ) throws DBWebException {
        WebDataTransferImportTaskConfig importTask =
            WebDataTransferUtils.getSessionDataTransferConfig(webSession).consumeImportTask(taskId);
        if (importTask == null) {
            throw new DBWebException("Data import task '" + taskId + "' not found");
        }
        WebAsyncTaskInfo taskInfo = webSession.getAsyncTask(taskId, "Data import", false);
        if (taskInfo == null) {
            throw new DBWebException("Data import task '" + taskId + "' not found");
        }
        webSession.addInfoMessage("Import data");
        log.info(String.format("Data import started: [userId=%s]", webSession.getUserId()));

        DataTransferProcessorDescriptor processor = importTask.getProcessor();
        DBSDataContainer dataContainer = importTask.getResults().getDataContainer();
        Map<String, Object> settings = importTask.getParameters().getSettings();
        WebAsyncTaskProcessor<String> runnable = new WebAsyncTaskProcessor<>() {
            @Override
            public void run(@NotNull DBRProgressMonitor monitor) throws InvocationTargetException {
                monitor.beginTask("Import data", 1);
                try {
                    monitor.subTask("Import data using " + processor.getName());
                    try {
                        importData(monitor, processor, (DBSDataManipulator) dataContainer, path, settings);
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
        return webSession.runAsyncTask(taskInfo, runnable);
    }

    public boolean validateImportPermission(@NotNull WebSession session) {
        if (WebAppUtils.getWebApplication().isCommunity()) {
            Map<String, Object> productSettings = WebAppUtils.getWebApplication().getServerConfiguration().getProductSettings();
            return !JSONUtils.getBoolean(productSettings, CBConstants.PREF_DATA_EDITOR_IMPORT_DISABLED_OLD, false);
        }
        return session.hasGlobalPermission(DBWConstants.GLOBAL_PERMISSION_DATA_EDITOR_IMPORT);
    }

    private void exportData(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DataTransferProcessorDescriptor processor,
        @NotNull DBSDataContainer dataContainer,
        @NotNull WebDataTransferParameters parameters,
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull OutputStream outputStream
    ) throws DBException {
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

        producer.transferData(monitor, consumer, null, producerSettings, null, -1);

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
        @NotNull DBRProgressMonitor monitor,
        @NotNull DataTransferProcessorDescriptor processor,
        @NotNull DBSDataManipulator dataContainer,
        @NotNull Path path,
        @Nullable Map<String, Object> settings
    ) throws DBException {
        IDataTransferProcessor processorInstance = processor.getInstance();

        StreamTransferProducer producer;
        if (dataContainer.getDataSource() != null) {
            producer = new StreamTransferProducer(new StreamEntityMapping(path), processor);

            DatabaseTransferConsumer consumer = new DatabaseTransferConsumer(dataContainer);
            DatabaseConsumerSettings databaseConsumerSettings = new DatabaseConsumerSettings();
            databaseConsumerSettings.setContainer((DBSObjectContainer) dataContainer.getDataSource());
            databaseConsumerSettings.setEnableQmLogging(true);
            applyImportSettings(databaseConsumerSettings, settings);
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
                properties
            );
            DatabaseMappingContainer databaseMappingContainer =
                new DatabaseMappingContainer(monitor, databaseConsumerSettings, producer.getDatabaseObject(), consumer.getTargetObject());
            databaseMappingContainer.getAttributeMappings(monitor);
            databaseMappingContainer.setTarget(dataContainer);
            consumer.setContainerMapping(databaseMappingContainer);
            try {
                producer.transferData(monitor, consumer, processorInstance, producerSettings, null, -1);
                if (monitor.isCanceled()) {
                    throw new DBWebException("Import is canceled");
                }
            } catch (DBException e) {
                throw new DBWebException("Import failed", e);
            }
        }
    }

    private void applyImportSettings(
        @NotNull DatabaseConsumerSettings consumerSettings,
        @Nullable Map<String, Object> settings
    ) {
        if (CommonUtils.isEmpty(settings)) {
            return;
        }
        consumerSettings.setOnDuplicateKeyInsertMethodId(CommonUtils.toString(
            settings.get(DTConstants.PROP_ON_DUPLICATE_KEY_METHOD),
            consumerSettings.getOnDuplicateKeyInsertMethodId()));
        consumerSettings.setUseBulkLoad(CommonUtils.getBoolean(
            settings.get(DTConstants.PROP_USE_BULK_LOAD),
            consumerSettings.isUseBulkLoad()));
        consumerSettings.setUseTransactions(CommonUtils.getBoolean(
            settings.get(DTConstants.PROP_USE_TRANSACTIONS),
            consumerSettings.isUseTransactions()));
        consumerSettings.setOpenNewConnections(CommonUtils.getBoolean(
            settings.get(DTConstants.PROP_OPEN_NEW_CONNECTION),
            consumerSettings.isOpenNewConnections()));
    }

}

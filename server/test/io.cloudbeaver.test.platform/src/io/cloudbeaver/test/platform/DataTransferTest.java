/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.test.platform;

import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.data.transfer.impl.WebDataTransferDefaultExportSettings;
import io.cloudbeaver.service.data.transfer.impl.WebDataTransferOutputSettings;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.tools.transfer.IDataTransferNode;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferProcessorDescriptor;
import org.jkiss.dbeaver.tools.transfer.registry.DataTransferRegistry;
import org.jkiss.dbeaver.tools.transfer.stream.StreamTransferConsumer;
import org.jkiss.dbeaver.tools.transfer.stream.StreamTransferProducer;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Data transfer test.
 */
public class DataTransferTest {
    private static WebGQLClient client;
    private static final String GQL_TRANSFER_STREAM_PROCESSORS = """
        query dataTransferAvailableStreamProcessors {
          result: dataTransferAvailableStreamProcessors {
            id
            name
          }
        }""";
    private static final String GQL_TRANSFER_IMPORT_STREAM_PROCESSORS = """
        query dataTransferAvailableImportStreamProcessors {
          result: dataTransferAvailableImportStreamProcessors {
            id
            name
          }
        }""";
    private static final String GQL_TRANSFER_DEFAULT_SETTINGS = """
        query dataTransferDefaultExportSettings {
          result: dataTransferDefaultExportSettings {
            outputSettings {
              insertBom
              encoding
              timestampPattern
              compress
            }
            supportedEncodings
          }
        }""";

    @BeforeClass
    public static void init() throws Exception {
        Assert.assertTrue(CBApplication.getInstance().getAppConfiguration().isResourceManagerEnabled());
        client = CEServerTestSuite.createClient();
        Map<String, Object> authInfo = CEServerTestSuite.authenticateTestUser(client);
        Assert.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));
    }

    @Test
    public void availableStreamProcessors() throws Exception {
        checkStreamProcessors(GQL_TRANSFER_STREAM_PROCESSORS, StreamTransferConsumer.class);
        checkStreamProcessors(GQL_TRANSFER_IMPORT_STREAM_PROCESSORS, StreamTransferProducer.class);
    }

    @Test
    public void checkDefaultSettings() throws Exception {
        WebDataTransferDefaultExportSettings defaultSettings = new WebDataTransferDefaultExportSettings();
        Map<String, Object> result = client.sendQuery(GQL_TRANSFER_DEFAULT_SETTINGS, null);

        WebDataTransferOutputSettings responseOutputSettings = new WebDataTransferOutputSettings(
            JSONUtils.getObject(result, "outputSettings")
        );
        WebDataTransferOutputSettings defaultOutputSettings = defaultSettings.getOutputSettings();
        Assert.assertEquals(defaultOutputSettings.getTimestampPattern(), responseOutputSettings.getTimestampPattern());
        Assert.assertEquals(defaultOutputSettings.isCompress(), responseOutputSettings.isCompress());
        Assert.assertEquals(defaultOutputSettings.getEncoding(), responseOutputSettings.getEncoding());
        Assert.assertEquals(defaultOutputSettings.isInsertBom(), responseOutputSettings.isInsertBom());

        Set<String> responseSupportedEncodings = new HashSet<>(JSONUtils.getStringList(result, "supportedEncodings"));
        Assert.assertEquals(defaultSettings.getSupportedEncodings(), responseSupportedEncodings);
    }

    private void checkStreamProcessors(
        @NotNull String gqlScript,
        @NotNull Class<? extends IDataTransferNode<?>> nodeType
    ) throws Exception {
        List<Map<String, Object>> result = client.sendQuery(gqlScript, null);
        // get set of processor ids
        Set<String> processorIds = result.stream()
            .map(p -> JSONUtils.getString(p, "id"))
            .collect(Collectors.toSet());
        List<DataTransferProcessorDescriptor> processors = DataTransferRegistry.getInstance()
            .getAvailableProcessors(nodeType, DBSEntity.class);
        assert processors != null;
        Assert.assertEquals(result.size(), processors.size());
        for (DataTransferProcessorDescriptor processor : processors) {
            Assert.assertTrue(processorIds.contains(processor.getFullId()));
        }
    }


}

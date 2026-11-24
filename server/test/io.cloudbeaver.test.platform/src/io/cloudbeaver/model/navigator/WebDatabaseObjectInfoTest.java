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
package io.cloudbeaver.model.navigator;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.navigator.WebDatabaseObjectInfo;
import org.jkiss.dbeaver.ext.oracle.model.OracleDataSource;
import org.jkiss.dbeaver.ext.oracle.model.OracleDataType;
import org.jkiss.dbeaver.ext.oracle.model.OracleSchema;
import org.jkiss.dbeaver.model.struct.DBSObjectWithScript;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

public class WebDatabaseObjectInfoTest {

    @Test
    public void predefinedOracleTypeHasNoScriptFeatures() {
        OracleDataType type = new OracleDataType(Mockito.mock(OracleDataSource.class), "BLOB", true);
        WebDatabaseObjectInfo info = new WebDatabaseObjectInfo(Mockito.mock(WebSession.class), type);
        List<String> features = List.of(info.getFeatures());

        Assertions.assertFalse(type.supportsObjectDefinition());
        Assertions.assertFalse(features.contains(WebDatabaseObjectInfo.OBJECT_FEATURE_SCRIPT));
        Assertions.assertFalse(features.contains(WebDatabaseObjectInfo.OBJECT_FEATURE_SCRIPT_EXTENDED));
        Assertions.assertTrue(features.contains(WebDatabaseObjectInfo.OBJECT_FEATURE_ENTITY));
    }

    @Test
    public void userDefinedOracleTypeKeepsScriptFeatures() {
        OracleDataType type = new OracleDataType(Mockito.mock(OracleSchema.class), "CUSTOM_TYPE", true);
        WebDatabaseObjectInfo info = new WebDatabaseObjectInfo(Mockito.mock(WebSession.class), type);
        List<String> features = List.of(info.getFeatures());

        Assertions.assertTrue(type.supportsObjectDefinition());
        Assertions.assertTrue(features.contains(WebDatabaseObjectInfo.OBJECT_FEATURE_SCRIPT));
        Assertions.assertTrue(features.contains(WebDatabaseObjectInfo.OBJECT_FEATURE_SCRIPT_EXTENDED));
    }

    @Test
    public void scriptObjectSupportsDefinitionByDefault() {
        DBSObjectWithScript object = Mockito.mock(DBSObjectWithScript.class, Mockito.CALLS_REAL_METHODS);
        WebDatabaseObjectInfo info = new WebDatabaseObjectInfo(Mockito.mock(WebSession.class), object);

        Assertions.assertTrue(object.supportsObjectDefinition());
        Assertions.assertTrue(List.of(info.getFeatures()).contains(WebDatabaseObjectInfo.OBJECT_FEATURE_SCRIPT));
    }
}

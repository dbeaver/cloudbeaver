/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.test.platform.sql;

import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

public class WebSQLResultsInfoTest {

    @Test
    public void rowPositionDoesNotDependOnBindingOrdinal() throws Exception {
        DBSDataContainer dataContainer = Mockito.mock(DBSDataContainer.class);
        DBDAttributeBinding firstAttribute = Mockito.mock(DBDAttributeBinding.class);
        DBDAttributeBinding secondAttribute = Mockito.mock(DBDAttributeBinding.class);
        Mockito.when(firstAttribute.getOrdinalPosition()).thenReturn(0);
        Mockito.when(secondAttribute.getOrdinalPosition()).thenReturn(0);

        WebSQLResultsInfo resultsInfo = new WebSQLResultsInfo(dataContainer, "test");
        resultsInfo.setAttributes(new DBDAttributeBinding[] {firstAttribute, secondAttribute});

        Assertions.assertEquals(1, resultsInfo.getAttributePosition(secondAttribute));
        Assertions.assertSame(secondAttribute, resultsInfo.getAttributeByPosition(1));
    }

    @Test
    public void documentIdPositionDoesNotDependOnRootOrdinalOrIdType() {
        DBSDataContainer dataContainer = Mockito.mock(DBSDataContainer.class);
        DBDAttributeBinding document = Mockito.mock(DBDAttributeBinding.class);
        DBDAttributeBinding numericAttribute = Mockito.mock(DBDAttributeBinding.class);
        DBDAttributeBinding idAttribute = Mockito.mock(DBDAttributeBinding.class);
        Mockito.when(numericAttribute.getName()).thenReturn("value");
        Mockito.when(numericAttribute.getTopParent()).thenReturn(document);
        Mockito.when(idAttribute.getName()).thenReturn("_id");
        Mockito.when(idAttribute.getTopParent()).thenReturn(document);

        WebSQLResultsInfo resultsInfo = new WebSQLResultsInfo(dataContainer, "test");
        resultsInfo.setAttributes(new DBDAttributeBinding[] {numericAttribute, idAttribute});
        resultsInfo.setDocumentIdAttributeName("_id");

        Assertions.assertEquals(1, resultsInfo.getDocumentIdAttributePosition(document));
    }
}

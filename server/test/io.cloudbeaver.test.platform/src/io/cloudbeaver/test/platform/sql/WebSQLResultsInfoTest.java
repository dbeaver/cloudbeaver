/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.test.platform.sql;

import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLQueryResultSet;
import io.cloudbeaver.service.sql.WebSQLResultSetExtension;
import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import io.cloudbeaver.service.sql.WebSQLResultsRow;
import io.cloudbeaver.service.sql.resultset.WebDBDResultSetDataModel;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

public class WebSQLResultsInfoTest {

    @Test
    public void advertisesOnlyThePresentationAttachedToThisResult() {
        var container = Mockito.mock(DBSDataContainer.class);
        var presentation = new WebSQLResultSetExtension.Presentation("test-presentation", new Object());
        var graphResult = new WebSQLQueryResultSet();
        var tableResult = new WebSQLQueryResultSet();
        graphResult.setResultsInfo(new WebSQLResultsInfo(container, "1", presentation));
        tableResult.setResultsInfo(new WebSQLResultsInfo(container, "2"));

        Assertions.assertEquals(List.of("test-presentation"), graphResult.getAvailablePresentations());
        Assertions.assertSame(presentation, graphResult.getResultsInfo().getPresentation());
        Assertions.assertTrue(tableResult.getAvailablePresentations().isEmpty());

        graphResult.getResultsInfo().invalidatePresentation();
        Assertions.assertEquals("1", graphResult.getId());
        Assertions.assertTrue(graphResult.getAvailablePresentations().isEmpty());
    }

    @Test
    public void updateModelPreservesRowsAndAssignsTheirOrder() {
        WebSQLResultsRow addedRow = new WebSQLResultsRow();
        WebSQLResultsRow updatedRow = new WebSQLResultsRow();
        WebSQLResultsRow deletedRow = new WebSQLResultsRow();

        WebDBDResultSetDataModel model = new WebDBDResultSetDataModel(
            Mockito.mock(WebSQLContextInfo.class),
            Mockito.mock(WebSQLResultsInfo.class),
            List.of(addedRow),
            List.of(updatedRow),
            List.of(deletedRow)
        );

        Assertions.assertEquals(List.of(addedRow, updatedRow, deletedRow), model.getAllRows());
        Assertions.assertEquals(0, addedRow.getRowNumber());
        Assertions.assertEquals(1, updatedRow.getRowNumber());
        Assertions.assertEquals(2, deletedRow.getRowNumber());
        Assertions.assertEquals(0, new WebSQLResultsRow().getValues().length);
    }

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

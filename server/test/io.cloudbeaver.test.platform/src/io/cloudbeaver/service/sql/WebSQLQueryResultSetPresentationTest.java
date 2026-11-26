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
package io.cloudbeaver.service.sql;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class WebSQLQueryResultSetPresentationTest {
    @Test
    void presentationResultKeepsSourceCountWithoutRows() {
        WebSQLQueryResultSet result = new WebSQLQueryResultSet();
        result.setHasMoreData(true);
        result.setRows(List.of());
        result.setColumns(new WebSQLQueryResultColumn[0]);
        result.setSourceRowCount(1);
        Object graph = new Object();
        result.setPresentationData(graph);

        assertTrue(result.isHasMoreData());
        assertTrue(result.getRowsWithMetaData().isEmpty());
        assertEquals(0, result.getColumns().length);
        assertEquals(1, result.getSourceRowCount());
        assertEquals(graph, result.getPresentationData());
    }

    @Test
    void ordinaryResultRetainsRowsWithoutPresentationData() {
        WebSQLQueryResultSet result = new WebSQLQueryResultSet();
        var row = new WebSQLQueryResultSetRow(new Object[] {"2026-11-05 12:34:56", "12.50"}, null);
        result.setRows(List.of(row));

        assertEquals(List.of(row), result.getRowsWithMetaData());
        assertNull(result.getSourceRowCount());
        assertNull(result.getPresentationData());
    }

    @Test
    void emptyPresentationRetainsFetchedRowCount() {
        WebSQLQueryResultSet result = new WebSQLQueryResultSet();
        result.setSourceRowCount(3);

        assertTrue(result.getRowsWithMetaData().isEmpty());
        assertEquals(3, result.getSourceRowCount());
    }
}

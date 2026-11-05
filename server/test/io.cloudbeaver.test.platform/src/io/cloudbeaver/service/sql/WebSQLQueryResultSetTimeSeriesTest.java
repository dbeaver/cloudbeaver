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

import org.jkiss.dbeaver.model.timeseries.TSData;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNull;

class WebSQLQueryResultSetTimeSeriesTest {
    @Test
    void graphResultDoesNotDuplicateSourceRows() {
        WebSQLQueryResultSet result = new WebSQLQueryResultSet();
        result.setHasMoreData(true);
        TSData graph = new TSData(1, List.of(
            new TSData.Series("a", "first", List.of(new TSData.Point(1000, 2)))
        ));

        var row = new WebSQLQueryResultSetRow(new Object[] {1000L, 2.0}, null);
        result.setRows(List.of(row));
        result.setTimeSeriesResult(graph);

        assertTrue(result.isHasMoreData());
        assertTrue(result.getRowsWithMetaData().isEmpty());
        assertEquals(0, result.getColumns().length);
        assertEquals(1, result.getTimeSeriesData().sourceRowCount());
        assertEquals(graph, result.getTimeSeriesData());
    }

    @Test
    void ordinaryResultRetainsRowsWithoutGraphData() {
        WebSQLQueryResultSet result = new WebSQLQueryResultSet();
        var row = new WebSQLQueryResultSetRow(new Object[] {"2026-11-05 12:34:56", "12.50"}, null);
        result.setRows(List.of(row));

        assertEquals(List.of(row), result.getRowsWithMetaData());
        assertNull(result.getTimeSeriesData());
    }
}

package io.cloudbeaver.service.sql;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDAttributeConstraint;
import org.jkiss.dbeaver.model.data.DBDDataFilter;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class WebSQLResultCacheService {

    private static final Log log = Log.getLog(WebSQLResultCacheService.class);
    /**
     * Retrieves cached results by result ID and applies sorting.
     *
     * @param resultId         the ID of the cached results
     * @param contextInfo      the SQL context information
     * @param webSQLDataFilter the web SQL data filter to apply
     * @return filtered cached results or null if no results found for the given ID
     */
    public WebSQLQueryResults getCachedSQLQueryResults(
        @Nullable String resultId,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull WebSQLDataFilter webSQLDataFilter
    ) {
        WebSQLQueryResults result;
        try {
            if (resultId == null) {
                return null;
            }
            WebSQLQueryResults cachedResults = contextInfo.getQueryResults(resultId);
            if (cachedResults == null) {
                return null;
            }
            // Work with a copy to not change cached results
            result = new WebSQLQueryResults(cachedResults);
            DBDDataFilter dataFilter = webSQLDataFilter.makeDataFilter(contextInfo.getResults(resultId));
            sortCachedResults(result, dataFilter);
        } catch (Exception e)  {
            log.warn("Error retrieving cached results for ID '" + resultId + "'", e);
            return null;
        }
        return result;
    }

    private void sortCachedResults(
        @NotNull WebSQLQueryResults cachedResults,
        @NotNull DBDDataFilter dataFilter
    ) {
        WebSQLQueryResultSet resultSet = cachedResults.getResultSet();
        if (resultSet == null) {
            return;
        }
        Object[][] allRows = resultSet.getRows();
        if (allRows.length == 0) {
            return;
        }
        List<WebSQLQueryResultSetRow> allRowsList = new ArrayList<>();
        for (Object[] row : allRows) {
            allRowsList.add(new WebSQLQueryResultSetRow(row, null));
        }
        List<DBDAttributeConstraint> orderConstraints = dataFilter.getOrderConstraints();
        if (!orderConstraints.isEmpty()) {
            allRowsList.sort((r1, r2) -> compareRowsByOrder(r1, r2, orderConstraints));
        }
        resultSet.setRows(allRowsList);
        resultSet.setHasMoreData(resultSet.isHasMoreData());
    }

    private int compareRowsByOrder(
        @NotNull WebSQLQueryResultSetRow r1,
        @NotNull WebSQLQueryResultSetRow r2,
        @NotNull List<DBDAttributeConstraint> orderConstraints
    ) {
        int result = 0;
        for (DBDAttributeConstraint attributeConstraint : orderConstraints) {
            int colIndex = attributeConstraint.getAttribute() != null ? attributeConstraint.getAttribute().getOrdinalPosition() : -1;
            if (colIndex < 0) {
                continue;
            }
            Object cell1 = r1.getData()[colIndex];
            Object cell2 = r2.getData()[colIndex];
            Comparator<Object> comparator = null;
            if (attributeConstraint.getAttribute() != null && attributeConstraint.getAttribute() instanceof DBDAttributeBinding binding) {
                comparator = binding.getValueHandler().getComparator();
            }
            if (comparator != null) {
                result = comparator.compare(cell1, cell2);
            } else {
                result = DBUtils.compareDataValues(cell1, cell2);
            }
            if (attributeConstraint.isOrderDescending()) {
                result = -result;
            }
            if (result != 0) {
                break;
            }
        }
        return result;
    }
}

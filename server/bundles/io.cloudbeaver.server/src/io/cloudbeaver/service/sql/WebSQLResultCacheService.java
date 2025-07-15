package io.cloudbeaver.service.sql;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDAttributeConstraint;
import org.jkiss.dbeaver.model.data.DBDDataFilter;
import org.jkiss.dbeaver.model.exec.DBCLogicalOperator;
import org.jkiss.dbeaver.model.sql.SQLDialect;
import org.jkiss.dbeaver.model.sql.SQLUtils;
import org.jkiss.utils.CommonUtils;

import java.util.*;
import java.util.regex.Pattern;

public class WebSQLResultCacheService {

    /**
     * Retrieves cached results by result ID and applies data filter and web SQL data filter.
     *
     * @param resultId         the ID of the cached results
     * @param cache            the cache map containing cached results
     * @param dataFilter       the data filter to apply
     * @param webSQLDataFilter the web SQL data filter to apply
     * @param sqlDialect       the SQL dialect to use for filtering
     * @return filtered cached results or null if no results found for the given ID
     */
    public WebSQLQueryResults getCachedResults(
        @Nullable String resultId,
        @NotNull Map<String, Object> cache,
        @NotNull DBDDataFilter dataFilter,
        @NotNull WebSQLDataFilter webSQLDataFilter,
        @NotNull SQLDialect sqlDialect
    ) {
        if (resultId == null) {
            return null;
        }
        Object cached = cache.get(resultId);
        if (!(cached instanceof WebSQLQueryResults cachedResults)) {
            return null;
        }
        // Work with a copy to not change cached results
        WebSQLQueryResults result = new WebSQLQueryResults(cachedResults);
        filterCachedResults(result, dataFilter, webSQLDataFilter, sqlDialect);
        return result;
    }

    private void filterCachedResults(
        @NotNull WebSQLQueryResults cachedResults,
        @NotNull DBDDataFilter dataFilter,
        @NotNull WebSQLDataFilter webSQLDataFilter,
        @NotNull SQLDialect sqlDialect
    ) {
        WebSQLQueryResultSet resultSet = cachedResults.getResultSet();
        if (resultSet == null) {
            return;
        }
        List<WebSQLQueryResultSetRow> allRows = resultSet.getRowsWithMetaData();
        if (allRows == null || allRows.isEmpty()) {
            return;
        }
        List<WebSQLQueryResultSetRow> filteredRows = new ArrayList<>();
        for (WebSQLQueryResultSetRow row : allRows) {
            if (matchesFilter(row, resultSet, dataFilter, sqlDialect)) {
                filteredRows.add(row);
            }
        }
        List<DBDAttributeConstraint> orderConstraints = dataFilter.getOrderConstraints();
        if (!orderConstraints.isEmpty()) {
            filteredRows.sort((r1, r2) -> compareRowsByOrder(r1, r2, orderConstraints));
        }
        List<WebSQLQueryResultSetRow> pagedRows = getPagedRows(filteredRows, webSQLDataFilter.getOffset(), webSQLDataFilter.getLimit());
        resultSet.setRows(pagedRows);
        resultSet.setHasMoreData(pagedRows.size() + webSQLDataFilter.getOffset() < filteredRows.size());
    }

    private boolean matchesFilter(
        WebSQLQueryResultSetRow row, WebSQLQueryResultSet resultSet, DBDDataFilter dataFilter,
        SQLDialect sqlDialect
    ) {
        for (var constraint : dataFilter.getConstraints()) {
            if (!constraint.hasFilter()) {
                continue;
            }
            int colIndex = constraint.getAttribute() != null ? constraint.getAttribute().getOrdinalPosition() : -1;
            if (colIndex < 0 || colIndex >= row.getData().length) {
                continue;
            }
            Object value = row.getData()[colIndex];
            if (constraint.getOperator() != null) {
                DBCLogicalOperator logicalOperator = constraint.getOperator();
                Object filterValue = constraint.getValue();
                Object[] args;
                if (filterValue instanceof Object[] arr) {
                    args = arr;
                } else if (filterValue != null) {
                    args = new Object[] {filterValue};
                } else {
                    args = null;
                }
                if (!logicalOperator.evaluate(value, args)) {
                    return false;
                }
            }
        }
        String where = dataFilter.getWhere();
        if (!CommonUtils.isEmpty(where)) {
            return evaluateWhere(row, resultSet, where, sqlDialect);
        }
        return true;
    }

    private boolean evaluateWhere(WebSQLQueryResultSetRow row, WebSQLQueryResultSet resultSet, String where, SQLDialect sqlDialect) {
        String[] andParts = where.split("(?i)\\s+AND\\s+");
        for (String andPart : andParts) {
            String[] orParts = andPart.split("(?i)\\s+OR\\s+");
            boolean orResult = false;
            for (String expr : orParts) {
                expr = expr.trim();
                if (expr.matches("(?i).+\\s+IS\\s+NULL")) {
                    String col = expr.replaceAll("(?i)\\s+IS\\s+NULL", "").trim();
                    int colIdx = getColumnIndexByName(resultSet, col);
                    if (colIdx >= 0 && row.getData()[colIdx] == null) {
                        orResult = true;
                        break;
                    }
                } else if (expr.matches("(?i).+\\s+IS\\s+NOT\\s+NULL")) {
                    String col = expr.replaceAll("(?i)\\s+IS\\s+NOT\\s+NULL", "").trim();
                    int colIdx = getColumnIndexByName(resultSet, col);
                    if (colIdx >= 0 && row.getData()[colIdx] != null) {
                        orResult = true;
                        break;
                    }
                } else if (expr.matches("(?i).+\\s+IN\\s*\\(.+\\)")) {
                    int inIdx = expr.toUpperCase().indexOf(" IN ");
                    String col = expr.substring(0, inIdx).trim();
                    String inList = expr.substring(expr.indexOf('(', inIdx) + 1, expr.lastIndexOf(')'));
                    int colIdx = getColumnIndexByName(resultSet, col);
                    if (colIdx >= 0) {
                        Object cell = row.getData()[colIdx];
                        String[] vals = inList.split(",");
                        for (String v : vals) {
                            if (cell != null && cell.toString().equals(sqlDialect.getUnquotedIdentifier(v.trim()))) {
                                orResult = true;
                                break;
                            }
                        }
                        if (orResult) {
                            break;
                        }
                    }
                } else if (expr.matches("(?i).+\\s+LIKE\\s+.+")) {
                    int likeIdx = expr.toUpperCase().indexOf(" LIKE ");
                    String col = expr.substring(0, likeIdx).trim();
                    String pattern = sqlDialect.getUnquotedString(expr.substring(likeIdx + 6).trim());
                    int colIdx = getColumnIndexByName(resultSet, col);
                    if (colIdx >= 0) {
                        Object cell = row.getData()[colIdx];
                        if (cell != null && likeMatch(cell.toString(), pattern, false)) {
                            orResult = true;
                            break;
                        }
                    }
                } else if (expr.matches("(?i).+\\s+ILIKE\\s+.+")) {
                    int ilikeIdx = expr.toUpperCase().indexOf(" ILIKE ");
                    String col = expr.substring(0, ilikeIdx).trim();
                    String pattern = sqlDialect.getUnquotedString(expr.substring(ilikeIdx + 7).trim());
                    int colIdx = getColumnIndexByName(resultSet, col);
                    if (colIdx >= 0) {
                        Object cell = row.getData()[colIdx];
                        if (cell != null && likeMatch(cell.toString(), pattern, true)) {
                            orResult = true;
                            break;
                        }
                    }
                } else if (expr.matches("(?i).+!=.+")) {
                    String[] parts = expr.split("!=");
                    if (parts.length == 2) {
                        String col = parts[0].trim();
                        String val = sqlDialect.getUnquotedString(parts[1].trim());
                        int colIdx = getColumnIndexByName(resultSet, col);
                        Object cell = colIdx >= 0 ? row.getData()[colIdx] : null;
                        if (cell != null && !cell.toString().equals(val)) {
                            orResult = true;
                            break;
                        }
                    }
                } else if (expr.matches("(?i).+=.+")) {
                    String[] parts = expr.split("=");
                    if (parts.length == 2) {
                        String col = parts[0].trim();
                        String val = sqlDialect.getQuotedString(parts[1].trim());
                        int colIdx = getColumnIndexByName(resultSet, col);
                        Object cell = colIdx >= 0 ? row.getData()[colIdx] : null;
                        if (cell != null && cell.toString().equals(val)) {
                            orResult = true;
                            break;
                        }
                    }
                }
            }
            if (!orResult) {
                return false;
            }
        }
        return true;
    }

    private int compareRowsByOrder(
        WebSQLQueryResultSetRow r1,
        WebSQLQueryResultSetRow r2,
        List<DBDAttributeConstraint> orderConstraints
    ) {
        int result = 0;
        for (DBDAttributeConstraint o : orderConstraints) {
            int colIndex = o.getAttribute() != null ? o.getAttribute().getOrdinalPosition() : -1;
            if (colIndex < 0) {
                continue;
            }
            Object cell1 = r1.getData()[colIndex];
            Object cell2 = r2.getData()[colIndex];
            Comparator<Object> comparator = null;
            if (o.getAttribute() != null && o.getAttribute() instanceof DBDAttributeBinding binding) {
                comparator = binding.getValueHandler().getComparator();
            }
            if (comparator != null) {
                result = comparator.compare(cell1, cell2);
            } else {
                result = DBUtils.compareDataValues(cell1, cell2);
            }
            if (o.isOrderDescending()) {
                result = -result;
            }
            if (result != 0) {
                break;
            }
        }
        return result;
    }

    private int getColumnIndexByName(WebSQLQueryResultSet resultSet, String columnName) {
        if (resultSet == null || columnName == null) {
            return -1;
        }
        String normalized = columnName.trim();
        if ((normalized.startsWith("'") && normalized.endsWith("'")) || (normalized.startsWith("\"") && normalized.endsWith("\""))) {
            normalized = normalized.substring(1, normalized.length() - 1);
        }
        normalized = normalized.trim();
        for (int i = 0; i < resultSet.getColumns().length; i++) {
            String colName = resultSet.getColumns()[i].getName();
            if (colName.equalsIgnoreCase(normalized)) {
                return i;
            }
        }
        for (int i = 0; i < resultSet.getColumns().length; i++) {
            String colName = resultSet.getColumns()[i].getName();
            if (colName.replaceAll("\\s+", "").equalsIgnoreCase(normalized.replaceAll("\\s+", ""))) {
                return i;
            }
        }
        return -1;
    }

    private boolean likeMatch(String value, String pattern, boolean caseInsensitive) {
        if (value == null || pattern == null) {
            return false;
        }
        String regex = SQLUtils.makeRegexFromLike(pattern);
        int flags = caseInsensitive ? Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE : 0;
        return Pattern.compile(regex, flags).matcher(value).matches();
    }

    private List<WebSQLQueryResultSetRow> getPagedRows(List<WebSQLQueryResultSetRow> filteredRows, int offset, int limit) {
        int fromIndex = Math.max(0, offset);
        int toIndex = limit > 0 ? Math.min(filteredRows.size(), fromIndex + limit) : filteredRows.size();
        if (fromIndex < toIndex) {
            return filteredRows.subList(fromIndex, toIndex);
        } else {
            return Collections.emptyList();
        }
    }
}

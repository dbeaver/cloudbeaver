package io.cloudbeaver.service.sql;

import java.util.HashMap;
import java.util.Map;

public class WebSQLQueryResultSetRow {

    private Object[] data;

    private Map<String, Object> metaData;

    public WebSQLQueryResultSetRow(Object[] data, Map<String, Object> metaData) {
        this.data = data;
        this.metaData = metaData;
    }

    public WebSQLQueryResultSetRow(WebSQLQueryResultSetRow webSQLQueryResultSetRow) {
        this.data = new Object[webSQLQueryResultSetRow.data.length];
        //fixme it is probably a issue with mutable objects in data array
        System.arraycopy(webSQLQueryResultSetRow.data, 0, this.data, 0, webSQLQueryResultSetRow.data.length);
        this.metaData = webSQLQueryResultSetRow.metaData == null ? null : new HashMap<>(webSQLQueryResultSetRow.metaData);
    }

    public Object[] getData() {
        return data;
    }

    public Map<String, Object> getMetaData() {
        return metaData;
    }

    public void setData(Object[] data) {
        this.data = data;
    }

    public void setMetaData(Map<String, Object> metaData) {
        this.metaData = metaData;
    }
}

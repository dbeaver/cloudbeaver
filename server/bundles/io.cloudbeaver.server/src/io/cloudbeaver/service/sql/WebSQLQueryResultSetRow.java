package io.cloudbeaver.service.sql;

import java.util.Map;

public class WebSQLQueryResultSetRow {

    private Object[] data;

    private Map<String, Object> metaData;

    public WebSQLQueryResultSetRow(Object[] data, Map<String, Object> metaData) {
        this.data = data;
        this.metaData = metaData;
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

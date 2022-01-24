package io.cloudbeaver.service.sql;

import org.jkiss.dbeaver.model.meta.Property;

import java.util.List;

public class WebSQLScriptInfo {
    private final List<WebSQLQueryInfo> queries;

    public WebSQLScriptInfo(List<WebSQLQueryInfo> queries) {
        this.queries = queries;
    }

    @Property
    public List<WebSQLQueryInfo> getQueries() {
        return queries;
    }
}

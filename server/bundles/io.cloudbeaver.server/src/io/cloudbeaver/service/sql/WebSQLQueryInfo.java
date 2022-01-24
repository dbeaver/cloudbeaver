package io.cloudbeaver.service.sql;

import org.jkiss.dbeaver.model.meta.Property;

public class WebSQLQueryInfo {
    private final int start;
    private final int end;

    public WebSQLQueryInfo(int start, int end) {
        this.start = start;
        this.end = end;
    }

    @Property
    public int getEnd() {
        return end;
    }

    @Property
    public int getStart() {
        return start;
    }
}

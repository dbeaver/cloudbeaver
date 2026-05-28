package io.cloudbeaver.service.sql;

import org.jkiss.code.NotNull;

public class WebSQLResultSetRowIdentifierAttribute {

    @NotNull
    private final String name;
    private final int ordinalPosition;

    public WebSQLResultSetRowIdentifierAttribute(
        @NotNull String name,
        int ordinalPosition
    ) {
        this.name = name;
        this.ordinalPosition = ordinalPosition;
    }

    @NotNull
    public String getName() {
        return name;
    }

    public int getOrdinalPosition() {
        return ordinalPosition;
    }
}

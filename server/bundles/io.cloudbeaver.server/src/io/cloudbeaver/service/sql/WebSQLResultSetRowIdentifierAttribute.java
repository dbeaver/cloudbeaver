package io.cloudbeaver.service.sql;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

public class WebSQLResultSetRowIdentifierAttribute {

    @NotNull
    private final String name;
    private final int ordinalPosition;

    public WebSQLResultSetRowIdentifierAttribute(
        @NotNull String name,
        int ordinalPosition,
        @NotNull String label,
        @Nullable String description
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

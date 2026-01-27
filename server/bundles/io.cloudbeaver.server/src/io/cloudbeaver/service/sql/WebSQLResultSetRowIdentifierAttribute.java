package io.cloudbeaver.service.sql;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

public class WebSQLResultSetRowIdentifierAttribute {

    @NotNull
    private final String name;

    private final int ordinalPosition;
    @NotNull
    private final String label;
    @Nullable
    private final String description;

    public WebSQLResultSetRowIdentifierAttribute(
        @NotNull String name,
        int ordinalPosition,
        @NotNull String label,
        @Nullable String description
    ) {
        this.name = name;
        this.ordinalPosition = ordinalPosition;
        this.label = label;
        this.description = description;
    }

    @NotNull
    public String getName() {
        return name;
    }

    public int getOrdinalPosition() {
        return ordinalPosition;
    }

    @NotNull
    public String getLabel() {
        return label;
    }

    @Nullable
    public String getDescription() {
        return description;
    }
}

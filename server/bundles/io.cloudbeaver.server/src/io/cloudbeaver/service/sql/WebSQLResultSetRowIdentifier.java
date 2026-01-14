package io.cloudbeaver.service.sql;

import org.jkiss.code.NotNull;

public class WebSQLResultSetRowIdentifier {

    @NotNull
    private final String name;
    @NotNull
    private final String type;

    public WebSQLResultSetRowIdentifier(@NotNull String name, @NotNull String type) {
        this.name = name;
        this.type = type;
    }

    @NotNull
    public String getName() {
        return name;
    }

    @NotNull
    public String getType() {
        return type;
    }
}

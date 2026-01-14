package io.cloudbeaver.service.sql;

import org.jkiss.code.NotNull;

public class WebSQLResultSetRowIdentifier {

    public static final String TABLE_METADATA_NOT_FOUND = "METADATA_NOT_FOUND"; //$NON-NLS-1$
    public static final String NO_ROW_ID = "NONE"; //$NON-NLS-1$
    public static final String PRIMARY_KEY = "PRIMARY_KEY"; //$NON-NLS-1$
    public static final String VIRTUAL_KEY = "VIRTUAL_KEY"; //$NON-NLS-1$

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

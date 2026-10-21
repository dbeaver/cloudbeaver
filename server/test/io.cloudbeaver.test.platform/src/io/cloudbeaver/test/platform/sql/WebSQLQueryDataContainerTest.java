/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.test.platform.sql;

import io.cloudbeaver.service.sql.WebSQLParametersProvider;
import io.cloudbeaver.service.sql.WebSQLQueryDataContainer;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.sql.SQLQuery;
import org.jkiss.dbeaver.model.sql.SQLSyntaxManager;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

public class WebSQLQueryDataContainerTest {

    @Test
    public void generatedQueryReplacesOriginalCommand() {
        DBPDataSource dataSource = Mockito.mock(DBPDataSource.class);
        WebSQLQueryDataContainer dataContainer = new WebSQLQueryDataContainer(
            dataSource,
            Mockito.mock(SQLSyntaxManager.class),
            "@ai show all customers",
            Mockito.mock(WebSQLParametersProvider.class)
        );

        dataContainer.setQuery(new SQLQuery(dataSource, "SELECT * FROM customers"));

        Assertions.assertEquals("SELECT * FROM customers", dataContainer.getName());
    }
}

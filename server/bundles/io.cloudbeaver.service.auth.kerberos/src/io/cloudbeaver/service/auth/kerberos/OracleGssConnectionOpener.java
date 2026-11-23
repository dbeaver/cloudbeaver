/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.service.auth.kerberos;

import org.ietf.jgss.GSSCredential;
import org.ietf.jgss.GSSException;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.impl.jdbc.JDBCAuthConnectionOpener;

import java.lang.reflect.InvocationTargetException;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Opens an Oracle connection with a delegated GSS credential.
 * <p>
 * The Oracle thin driver accepts a {@link GSSCredential} only through {@code OracleConnectionBuilder}
 * (Oracle JDBC 19c and newer), not through {@link Driver#connect}. The driver classes are loaded
 * from the driver class loader at run time, so this bundle does not depend on the driver jar.
 */
public class OracleGssConnectionOpener implements JDBCAuthConnectionOpener {

    private static final Log log = Log.getLog(OracleGssConnectionOpener.class);

    private static final String ORACLE_DATA_SOURCE_CLASS = "oracle.jdbc.pool.OracleDataSource";
    private static final String ORACLE_CONNECTION_BUILDER_CLASS = "oracle.jdbc.OracleConnectionBuilder";

    private final GSSCredential credential;

    public OracleGssConnectionOpener(@NotNull GSSCredential credential) {
        this.credential = credential;
    }

    @NotNull
    @Override
    public Connection openConnection(
        @NotNull DBPDriver driver,
        @Nullable Driver driverInstance,
        @NotNull String url,
        @NotNull Properties connectProps
    ) throws SQLException {
        ClassLoader classLoader = driverInstance != null
            ? driverInstance.getClass().getClassLoader()
            : Thread.currentThread().getContextClassLoader();
        try {
            Class<?> dataSourceClass = Class.forName(ORACLE_DATA_SOURCE_CLASS, true, classLoader);
            Class<?> builderClass = Class.forName(ORACLE_CONNECTION_BUILDER_CLASS, true, classLoader);

            Object dataSource = dataSourceClass.getConstructor().newInstance();
            dataSourceClass.getMethod("setURL", String.class).invoke(dataSource, url);
            dataSourceClass.getMethod("setConnectionProperties", Properties.class).invoke(dataSource, prepareProperties(connectProps));

            Object builder = dataSourceClass.getMethod("createConnectionBuilder").invoke(dataSource);
            builder = builderClass.getMethod("gssCredential", GSSCredential.class).invoke(builder, credential);
            return (Connection) builderClass.getMethod("build").invoke(builder);
        } catch (InvocationTargetException e) {
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            if (cause instanceof SQLException sqlException) {
                throw sqlException;
            }
            throw new SQLException("Error opening Oracle connection with delegated Kerberos credentials: "
                + cause.getMessage(), cause);
        } catch (ReflectiveOperationException | ClassCastException e) {
            throw new SQLException("Oracle driver '" + driver.getFullName()
                + "' does not support GSS credential connections. Oracle JDBC 19c or newer is required.", e);
        } finally {
            disposeCredential();
        }
    }

    @NotNull
    private static Properties prepareProperties(@NotNull Properties connectProps) {
        Properties properties = new Properties();
        properties.putAll(connectProps);
        // Oracle rejects a user name together with a GSS credential
        properties.remove(DBConstants.DATA_SOURCE_PROPERTY_USER);
        properties.remove(DBConstants.DATA_SOURCE_PROPERTY_PASSWORD);
        return properties;
    }

    private void disposeCredential() {
        try {
            credential.dispose();
        } catch (GSSException e) {
            log.debug("Error disposing delegated Kerberos credential", e);
        }
    }
}

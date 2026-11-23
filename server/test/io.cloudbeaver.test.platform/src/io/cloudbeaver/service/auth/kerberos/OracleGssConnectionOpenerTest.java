/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
package io.cloudbeaver.service.auth.kerberos;

import oracle.jdbc.pool.OracleDataSource;
import org.ietf.jgss.GSSCredential;
import org.ietf.jgss.GSSException;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.lang.reflect.Proxy;
import java.net.URL;
import java.net.URLClassLoader;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.SQLException;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Uses the {@code oracle.jdbc} test stand-ins from this bundle in place of the real driver.
 */
public class OracleGssConnectionOpenerTest {

    private static final String URL = "jdbc:oracle:thin:@tcps://db.corp.example.com:2484/ORCL";

    private final DBPDriver driver = Mockito.mock(DBPDriver.class);
    private final GSSCredential credential = Mockito.mock(GSSCredential.class);

    @BeforeEach
    void setUp() {
        OracleDataSource.reset();
        Mockito.when(driver.getFullName()).thenReturn("Oracle Thin");
    }

    @AfterEach
    void tearDown() {
        OracleDataSource.reset();
    }

    @Test
    void opensThroughBuilderWithCredentialAndWithoutUserPassword() throws Exception {
        Connection expected = Mockito.mock(Connection.class);
        OracleDataSource.connectionToReturn = expected;
        Properties props = new Properties();
        props.setProperty("user", "ignored");
        props.setProperty("password", "ignored");
        props.setProperty("oracle.net.authentication_services", "(KERBEROS5)");

        Connection actual = new OracleGssConnectionOpener(credential)
            .openConnection(driver, new StubDriver(), URL, props);

        assertSame(expected, actual);
        assertEquals(URL, OracleDataSource.lastUrl);
        assertSame(credential, OracleDataSource.lastCredential);
        assertEquals("(KERBEROS5)", OracleDataSource.lastProperties.getProperty("oracle.net.authentication_services"));
        assertNull(OracleDataSource.lastProperties.getProperty("user"));
        assertNull(OracleDataSource.lastProperties.getProperty("password"));
        // the caller's properties are left untouched
        assertEquals("ignored", props.getProperty("user"));
        Mockito.verify(credential).dispose();
    }

    @Test
    void usesContextClassLoaderWhenDriverInstanceIsMissing() throws Exception {
        Connection expected = Mockito.mock(Connection.class);
        OracleDataSource.connectionToReturn = expected;
        ClassLoader original = Thread.currentThread().getContextClassLoader();
        Thread.currentThread().setContextClassLoader(getClass().getClassLoader());
        try {
            Connection actual = new OracleGssConnectionOpener(credential)
                .openConnection(driver, null, URL, new Properties());
            assertSame(expected, actual);
        } finally {
            Thread.currentThread().setContextClassLoader(original);
        }
    }

    @Test
    void driverErrorIsPropagatedAndCredentialDisposed() throws Exception {
        OracleDataSource.failure = new SQLException("ORA-12631: Username retrieval failed", "72000", 12631);

        SQLException error = assertThrows(SQLException.class, () -> new OracleGssConnectionOpener(credential)
            .openConnection(driver, new StubDriver(), URL, new Properties()));

        assertSame(OracleDataSource.failure, error);
        Mockito.verify(credential).dispose();
    }

    @Test
    void disposeFailureDoesNotHideResult() throws Exception {
        Connection expected = Mockito.mock(Connection.class);
        OracleDataSource.connectionToReturn = expected;
        Mockito.doThrow(new GSSException(GSSException.FAILURE)).when(credential).dispose();

        Connection actual = new OracleGssConnectionOpener(credential)
            .openConnection(driver, new StubDriver(), URL, new Properties());

        assertSame(expected, actual);
    }

    @Test
    void driverWithoutBuilderSupportIsReported() {
        ClassLoader isolated = new URLClassLoader(new URL[0], ClassLoader.getPlatformClassLoader());
        Driver oldDriver = (Driver) Proxy.newProxyInstance(isolated, new Class<?>[]{Driver.class},
            (proxy, method, args) -> {
                throw new UnsupportedOperationException(method.getName());
            });

        SQLException error = assertThrows(SQLException.class, () -> new OracleGssConnectionOpener(credential)
            .openConnection(driver, oldDriver, URL, new Properties()));

        assertTrue(error.getMessage().contains("Oracle Thin"), error.getMessage());
        assertTrue(error.getMessage().contains("19c"), error.getMessage());
        assertFalse(OracleDataSource.lastUrl != null, "Stand-in data source must not have been reached");
    }

    /**
     * Loaded by this bundle's class loader, so the opener resolves the {@code oracle.jdbc} stand-ins.
     */
    private static final class StubDriver implements Driver {
        @Override
        public Connection connect(String url, Properties info) {
            throw new UnsupportedOperationException("Driver.connect must not be used for GSS connections");
        }

        @Override
        public boolean acceptsURL(String url) {
            return url.startsWith("jdbc:oracle:");
        }

        @Override
        public java.sql.DriverPropertyInfo[] getPropertyInfo(String url, Properties info) {
            return new java.sql.DriverPropertyInfo[0];
        }

        @Override
        public int getMajorVersion() {
            return 23;
        }

        @Override
        public int getMinorVersion() {
            return 2;
        }

        @Override
        public boolean jdbcCompliant() {
            return true;
        }

        @Override
        public java.util.logging.Logger getParentLogger() {
            return java.util.logging.Logger.getGlobal();
        }
    }
}

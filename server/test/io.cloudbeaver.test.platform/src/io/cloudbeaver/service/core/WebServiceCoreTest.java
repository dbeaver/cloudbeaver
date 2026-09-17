/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.service.core;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebObjectId;
import io.cloudbeaver.WebParameterSecure;
import io.cloudbeaver.WebProjectAction;
import io.cloudbeaver.WebSessionProjectImpl;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.core.impl.WebServiceCore;
import org.eclipse.core.runtime.IProgressMonitor;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.eclipse.core.runtime.jobs.Job;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistryCache;
import org.jkiss.dbeaver.model.rm.RMConstants;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.io.InputStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CancellationException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

public class WebServiceCoreTest {
    private static final String DATA_SOURCE_ID = "temporary-id";

    @Test
    public void testExplicitUnknownProjectDoesNotFallBackToActiveProject() {
        WebSession webSession = Mockito.mock(WebSession.class);
        Mockito.when(webSession.getAccessibleProjects()).thenReturn(List.of());

        DBWebException error = Assertions.assertThrows(
            DBWebException.class,
            () -> new WebServiceCore().testConnection(webSession, "missing-project", Map.of(), null)
        );

        Assertions.assertTrue(error.getMessage().contains("missing-project"));
        Mockito.verify(webSession, Mockito.never()).getProjectById(Mockito.any());
    }

    @Test
    public void testCleanupRemovesSessionAndDriverRegisteredDescriptorWithoutPersistentDelete() {
        CleanupMocks mocks = cleanupMocks(true);

        DBWebException error = WebServiceCore.cleanupTemporaryDataSource(
            mocks.project,
            mocks.dataSource,
            new Job[0]
        );

        Assertions.assertNull(error);
        ArgumentCaptor<DBRProgressMonitor> monitor = ArgumentCaptor.forClass(DBRProgressMonitor.class);
        Mockito.verify(mocks.dataSource).disconnect(monitor.capture());
        Assertions.assertInstanceOf(VoidProgressMonitor.class, monitor.getValue());
        Mockito.verify(mocks.project).removeConnection(mocks.dataSource);
        Mockito.verify(mocks.registryCache).removeDataSourceFromList(mocks.dataSource);
        Mockito.verify(mocks.registry, Mockito.never()).removeDataSource(Mockito.any());
    }

    @Test
    public void testCleanupUsesDescriptorOwnerRegistry() {
        CleanupMocks mocks = cleanupMocks(true);
        DBPDataSourceRegistry requestRegistry = Mockito.mock(DBPDataSourceRegistry.class);
        Mockito.when(mocks.project.getDataSourceRegistry()).thenReturn(requestRegistry);

        DBWebException error = WebServiceCore.cleanupTemporaryDataSource(
            mocks.project,
            mocks.dataSource,
            new Job[0]
        );

        Assertions.assertNull(error);
        Mockito.verify(mocks.registryCache).removeDataSourceFromList(mocks.dataSource);
        Mockito.verifyNoInteractions(requestRegistry);
    }

    @Test
    public void testCleanupDisposesUnregisteredDescriptor() {
        CleanupMocks mocks = cleanupMocks(false);

        DBWebException error = WebServiceCore.cleanupTemporaryDataSource(
            mocks.project,
            mocks.dataSource,
            new Job[0]
        );

        Assertions.assertNull(error);
        Mockito.verify(mocks.dataSource).dispose();
        Mockito.verify(mocks.registryCache, Mockito.never()).removeDataSourceFromList(Mockito.any());
    }

    @Test
    public void testCleanupAttemptsEveryStepAndReportsFailures() {
        CleanupMocks mocks = cleanupMocks(true);
        Mockito.when(mocks.dataSource.disconnect(Mockito.any())).thenReturn(false);
        Mockito.doThrow(new IllegalStateException("session removal failed"))
            .when(mocks.project).removeConnection(mocks.dataSource);
        Mockito.doThrow(new IllegalStateException("registry removal failed"))
            .when(mocks.registryCache).removeDataSourceFromList(mocks.dataSource);

        DBWebException error = WebServiceCore.cleanupTemporaryDataSource(
            mocks.project,
            mocks.dataSource,
            new Job[0]
        );

        Assertions.assertNotNull(error);
        Assertions.assertTrue(error.getMessage().startsWith("Failed to clean up temporary connection"));
        Mockito.verify(mocks.dataSource).disconnect(Mockito.any(VoidProgressMonitor.class));
        Mockito.verify(mocks.project).removeConnection(mocks.dataSource);
        Mockito.verify(mocks.registryCache).removeDataSourceFromList(mocks.dataSource);
        Mockito.verify(mocks.registry, Mockito.never()).removeDataSource(Mockito.any());
    }

    @Test
    public void testCleanupCancelsAndJoinsNonTerminalJobs() throws Exception {
        CleanupMocks mocks = cleanupMocks(false);
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch canceled = new CountDownLatch(1);
        Job job = new Job("connection cleanup test") {
            @Override
            protected @NotNull IStatus run(@NotNull IProgressMonitor monitor) {
                started.countDown();
                while (!monitor.isCanceled()) {
                    try {
                        Thread.sleep(5);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        return Status.CANCEL_STATUS;
                    }
                }
                canceled.countDown();
                return Status.CANCEL_STATUS;
            }
        };
        job.schedule();
        Assertions.assertTrue(started.await(5, TimeUnit.SECONDS));

        DBWebException error = WebServiceCore.cleanupTemporaryDataSource(
            mocks.project,
            mocks.dataSource,
            new Job[]{job}
        );

        Assertions.assertNull(error);
        Assertions.assertTrue(canceled.await(5, TimeUnit.SECONDS));
        Assertions.assertEquals(Job.NONE, job.getState());
    }

    @Test
    public void testCleanupRestoresInterruptAfterLaterSteps() throws Exception {
        CleanupMocks mocks = cleanupMocks(false);
        CountDownLatch started = new CountDownLatch(1);
        Job job = new Job("interrupted connection cleanup test") {
            @Override
            protected @NotNull IStatus run(@NotNull IProgressMonitor monitor) {
                started.countDown();
                try {
                    Thread.sleep(500);
                    return Status.OK_STATUS;
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return Status.CANCEL_STATUS;
                }
            }
        };
        job.schedule();
        Assertions.assertTrue(started.await(5, TimeUnit.SECONDS));
        Mockito.when(mocks.dataSource.disconnect(Mockito.any())).thenAnswer(invocation -> {
            Assertions.assertEquals(Job.NONE, job.getState());
            return true;
        });
        Thread testThread = Thread.currentThread();
        Thread interrupter = new Thread(() -> {
            try {
                Thread.sleep(50);
                testThread.interrupt();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        interrupter.start();

        try {
            DBWebException error = WebServiceCore.cleanupTemporaryDataSource(
                mocks.project,
                mocks.dataSource,
                new Job[]{job}
            );

            Assertions.assertNotNull(error);
            Assertions.assertTrue(Thread.currentThread().isInterrupted());
            Mockito.verify(mocks.dataSource).disconnect(Mockito.any(VoidProgressMonitor.class));
            Mockito.verify(mocks.project).removeConnection(mocks.dataSource);
        } finally {
            Thread.interrupted();
            interrupter.join();
            job.join();
        }
    }

    @Test
    public void testCleanupDefersPreexistingInterruptUntilAllStepsFinish() {
        CleanupMocks mocks = cleanupMocks(false);
        AtomicReference<Boolean> interruptedDuringDisconnect = new AtomicReference<>();
        Mockito.when(mocks.dataSource.disconnect(Mockito.any())).thenAnswer(invocation -> {
            interruptedDuringDisconnect.set(Thread.currentThread().isInterrupted());
            return true;
        });

        try {
            Thread.currentThread().interrupt();
            DBWebException error = WebServiceCore.cleanupTemporaryDataSource(
                mocks.project,
                mocks.dataSource,
                new Job[0]
            );

            Assertions.assertNull(error);
            Assertions.assertFalse(interruptedDuringDisconnect.get());
            Assertions.assertTrue(Thread.currentThread().isInterrupted());
        } finally {
            Thread.interrupted();
        }
    }

    @Test
    public void testConnectionCancellationIsNotReportedAsSuccess() {
        DBRProgressMonitor monitor = Mockito.mock(DBRProgressMonitor.class);
        Mockito.when(monitor.isCanceled()).thenReturn(true);
        Assertions.assertThrows(
            CancellationException.class,
            () -> WebServiceCore.checkConnectionTestCancellation(monitor, Status.OK_STATUS)
        );

        Mockito.when(monitor.isCanceled()).thenReturn(false);
        Assertions.assertThrows(
            CancellationException.class,
            () -> WebServiceCore.checkConnectionTestCancellation(monitor, Status.CANCEL_STATUS)
        );
    }

    @Test
    public void testGraphQLContractAndSecureParameters() throws Exception {
        try (InputStream input = WebServiceCore.class.getClassLoader().getResourceAsStream("schema/service.core.graphqls")) {
            Assertions.assertNotNull(input);
            String schema = new String(input.readAllBytes(), StandardCharsets.UTF_8);
            Assertions.assertTrue(schema.contains("input ConnectionTestExtensionInput @since(version: \"26.2.1\")"));
            Assertions.assertTrue(schema.contains("extensions: [ConnectionTestExtensionInput!] @since(version: \"26.2.1\")"));
        }

        Method testConnection = DBWServiceCore.class.getMethod(
            "testConnection", WebSession.class, String.class, Map.class, List.class
        );
        Assertions.assertEquals(
            RMConstants.PERMISSION_PROJECT_DATASOURCES_EDIT,
            testConnection.getAnnotation(WebProjectAction.class).requireProjectPermissions()[0]
        );
        Assertions.assertNotNull(testConnection.getParameters()[1].getAnnotation(WebObjectId.class));
        Assertions.assertNotNull(testConnection.getParameters()[2].getAnnotation(WebParameterSecure.class));
        Assertions.assertNotNull(testConnection.getParameters()[3].getAnnotation(WebParameterSecure.class));
    }

    @Test
    public void testConnectionInfoPreservesMeasuredConnectTimeAfterDisconnect() {
        DataSourceDescriptor dataSource = Mockito.mock(DataSourceDescriptor.class);
        WebConnectionInfo connectionInfo = new WebConnectionInfo(Mockito.mock(WebSession.class), dataSource);
        connectionInfo.setConnectTime("125 ms");

        Assertions.assertEquals("125 ms", connectionInfo.getConnectTime());
        Mockito.verify(dataSource, Mockito.never()).getConnectTime();
    }

    @NotNull
    private static CleanupMocks cleanupMocks(boolean registered) {
        WebSessionProjectImpl project = Mockito.mock(WebSessionProjectImpl.class);
        DBPDataSourceRegistry registry = Mockito.mock(
            DBPDataSourceRegistry.class,
            Mockito.withSettings().extraInterfaces(DBPDataSourceRegistryCache.class)
        );
        DBPDataSourceRegistryCache registryCache = (DBPDataSourceRegistryCache) registry;
        DataSourceDescriptor dataSource = Mockito.mock(DataSourceDescriptor.class);
        WebConnectionInfo connectionInfo = Mockito.mock(WebConnectionInfo.class);
        AtomicReference<WebConnectionInfo> cachedConnection = new AtomicReference<>(connectionInfo);
        AtomicReference<DataSourceDescriptor> registeredDataSource = new AtomicReference<>(registered ? dataSource : null);
        Mockito.when(dataSource.getId()).thenReturn(DATA_SOURCE_ID);
        Mockito.when(dataSource.getRegistry()).thenReturn(registry);
        Mockito.when(dataSource.disconnect(Mockito.any())).thenReturn(true);
        Mockito.when(connectionInfo.getDataSourceContainer()).thenReturn(dataSource);
        Mockito.when(project.findWebConnectionInfo(DATA_SOURCE_ID)).thenAnswer(invocation -> cachedConnection.get());
        Mockito.doAnswer(invocation -> {
            cachedConnection.set(null);
            return null;
        }).when(project).removeConnection(dataSource);
        Mockito.when(project.getDataSourceRegistry()).thenReturn(registry);
        Mockito.when(registry.getDataSource(DATA_SOURCE_ID)).thenAnswer(invocation -> registeredDataSource.get());
        Mockito.doAnswer(invocation -> {
            registeredDataSource.set(null);
            return null;
        }).when(registryCache).removeDataSourceFromList(dataSource);
        return new CleanupMocks(project, registry, registryCache, dataSource);
    }

    private record CleanupMocks(
        WebSessionProjectImpl project,
        DBPDataSourceRegistry registry,
        DBPDataSourceRegistryCache registryCache,
        DataSourceDescriptor dataSource
    ) {
    }
}

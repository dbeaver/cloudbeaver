/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.model.session;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebSessionProjectImpl;
import io.cloudbeaver.utils.WebTestUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;

import java.util.List;

public class WebSessionProjectTest extends CloudbeaverMockTest {
    @Mock
    private WebSession webSession;
    @Mock
    private RMProject rmProject;


    @Before
    public void setUp() throws Exception {
        var sessionContext = Mockito.mock(SMSessionContext.class);
        Mockito.when(webSession.getSessionContext()).thenReturn(sessionContext);
        Mockito.when(rmProject.getType()).thenReturn(RMProjectType.SHARED);
        Mockito.when(rmProject.getName()).thenReturn("p1");
    }


    @Test
    public void testAddFindRemoveConnection() throws Exception {
        DBPDataSourceRegistry registry = Mockito.mock(DBPDataSourceRegistry.class);
        DataSourceDescriptor ds = Mockito.mock(DataSourceDescriptor.class);
        Mockito.when(ds.getId()).thenReturn("ds1");

        WebSessionProjectImpl project = new WebSessionProjectImpl(webSession, rmProject) {
            @NotNull
            @Override
            public DBPDataSourceRegistry getDataSourceRegistry() {
                return registry;
            }
        };

        // add connection
        var info = project.addConnection(ds);
        Assert.assertNotNull(info);
        var fetched = project.findWebConnectionInfo("ds1");
        Assert.assertNotNull(fetched);
        Assert.assertEquals("ds1", fetched.getDataSourceContainer().getId());

        // remove connection
        project.removeConnection(ds);
        Assert.assertNull(project.findWebConnectionInfo("ds1"));
    }

    @Test
    public void testGetWebConnectionInfoNotFoundThrows() throws Exception {
        DBPDataSourceRegistry registry = Mockito.mock(DBPDataSourceRegistry.class);
        Mockito.when(registry.getDataSource("missing")).thenReturn(null);

        WebSessionProjectImpl project = new WebSessionProjectImpl(webSession, rmProject) {
            @NotNull
            @Override
            public DBPDataSourceRegistry getDataSourceRegistry() {
                return registry;
            }
        };
        Assert.assertThrows(DBWebException.class, () -> project.getWebConnectionInfo("missing"));
    }

    @Test
    public void testGetConnectionsLoadsRegistry() throws Exception {

        DBPDataSourceRegistry registry = Mockito.mock(DBPDataSourceRegistry.class);
        DataSourceDescriptor ds = Mockito.mock(DataSourceDescriptor.class);
        Mockito.when(ds.getId()).thenReturn("ds1");
        List<DBPDataSourceContainer> ds1 = List.of(ds);
        Mockito.doReturn(ds1).when(registry).getDataSources();
        Mockito.when(registry.getLastError()).thenReturn(null);

        WebSessionProjectImpl project = new WebSessionProjectImpl(webSession, rmProject) {
            @NotNull
            @Override
            public DBPDataSourceRegistry getDataSourceRegistry() {
                return registry;
            }
        };

        List<?> connections = project.getConnections();

        Mockito.verify(registry, Mockito.times(1)).getDataSources();
        Assert.assertNotNull(connections);
        Assert.assertEquals(1, connections.size());
        Assert.assertEquals("ds1", project.getConnections().getFirst().getDataSourceContainer().getId());
    }

    @Test
    public void testUpdateProjectDataSourcesCreates() throws Exception {
        DBPDataSourceRegistry registry = Mockito.mock(DBPDataSourceRegistry.class);
        DataSourceDescriptor ds = Mockito.mock(DataSourceDescriptor.class);
        Mockito.when(ds.getId()).thenReturn("ds1");
        Mockito.when(registry.getDataSource("ds1")).thenReturn(ds);

        WebSessionProjectImpl project = new WebSessionProjectImpl(webSession, rmProject) {
            @NotNull
            @Override
            public DBPDataSourceRegistry getDataSourceRegistry() {
                return registry;
            }
        };

        WSDataSourceEvent event = Mockito.mock(WSDataSourceEvent.class);
        Mockito.when(event.getId()).thenReturn(WSDataSourceEvent.CREATED);
        Mockito.when(event.getDataSourceIds()).thenReturn(List.of("ds1"));

        boolean res = project.updateProjectDataSources(event);
        Assert.assertTrue(res);
        var info = project.findWebConnectionInfo("ds1");
        Assert.assertNotNull(info);
        Assert.assertEquals("ds1", info.getDataSourceContainer().getId());

    }

    @Test
    public void testUpdateProjectDataSourcesUpdates() throws Exception {
        DBPDataSourceRegistry registry = Mockito.mock(DBPDataSourceRegistry.class);
        DataSourceDescriptor ds = Mockito.mock(DataSourceDescriptor.class);
        List<DBPDataSourceContainer> ds1 = List.of(ds);
        Mockito.doReturn(ds1).when(registry).getDataSources();
        Mockito.when(ds.getId()).thenReturn("ds1");
        Mockito.when(registry.getDataSource("ds1")).thenReturn(ds);

        WebSessionProjectImpl project = new WebSessionProjectImpl(webSession, rmProject) {
            @NotNull
            @Override
            public DBPDataSourceRegistry getDataSourceRegistry() {
                return registry;
            }
        };

        Assert.assertNotNull(project.getConnections());

        WSDataSourceEvent event = Mockito.mock(WSDataSourceEvent.class);
        Mockito.when(event.getId()).thenReturn(WSDataSourceEvent.UPDATED);
        Mockito.when(event.getDataSourceIds()).thenReturn(List.of("ds1"));
        Mockito.when(event.getProperty()).thenReturn(WSDataSourceProperty.NAME);

        Assert.assertTrue(project.updateProjectDataSources(event));
        var info = project.findWebConnectionInfo("ds1");
        Assert.assertNotNull(info);
        Assert.assertEquals("ds1", info.getDataSourceContainer().getId());

        Mockito.when(event.getProperty()).thenReturn(WSDataSourceProperty.INTERNAL);
        Assert.assertFalse(project.updateProjectDataSources(event));

    }

    @Test
    public void testUpdateProjectDataSourcesDeletes() throws Exception {
        DBPDataSourceRegistry registry = Mockito.mock(DBPDataSourceRegistry.class);
        DataSourceDescriptor ds = Mockito.mock(DataSourceDescriptor.class);
        Mockito.when(ds.getId()).thenReturn("ds1");
        Mockito.when(registry.getDataSource("ds1")).thenReturn(ds);

        WebSessionProjectImpl project = new WebSessionProjectImpl(webSession, rmProject) {
            @NotNull
            @Override
            public DBPDataSourceRegistry getDataSourceRegistry() {
                return registry;
            }
        };

        // preload connection
        project.addConnection(ds);

        WSDataSourceEvent event = Mockito.mock(WSDataSourceEvent.class);
        Mockito.when(event.getId()).thenReturn(WSDataSourceEvent.DELETED);
        Mockito.when(event.getDataSourceIds()).thenReturn(List.of("ds1"));

        boolean res = project.updateProjectDataSources(event);
        Assert.assertTrue(res);
        Assert.assertNull(project.findWebConnectionInfo("ds1"));
    }

    @Test
    public void testUpdateProjectDataSourcesCreateMissingReturnsFalse() throws Exception {
        DBPDataSourceRegistry registry = Mockito.mock(DBPDataSourceRegistry.class);
        Mockito.when(registry.getDataSource("ds1")).thenReturn(null);

        WebSessionProjectImpl project = new WebSessionProjectImpl(webSession, rmProject) {
            @NotNull
            @Override
            public DBPDataSourceRegistry getDataSourceRegistry() {
                return registry;
            }
        };

        WSDataSourceEvent event = Mockito.mock(WSDataSourceEvent.class);
        Mockito.when(event.getId()).thenReturn(WSDataSourceEvent.CREATED);
        Mockito.when(event.getDataSourceIds()).thenReturn(List.of("ds1"));

        boolean res = project.updateProjectDataSources(event);
        Assert.assertFalse(res);
        Assert.assertNull(project.findWebConnectionInfo("ds1"));
    }

    @Test
    public void testGetConnectionsDoesNotReloadWhenRegistryIsLoaded() throws Exception {
        DBPDataSourceRegistry registry = Mockito.mock(DBPDataSourceRegistry.class);
        DBPDataSourceContainer ds = Mockito.mock(DBPDataSourceContainer.class);
        Mockito.when(ds.getId()).thenReturn("ds1");

        WebSessionProjectImpl project = new WebSessionProjectImpl(webSession, rmProject) {
            @NotNull
            @Override
            public DBPDataSourceRegistry getDataSourceRegistry() {
                return registry;
            }
        };

        WebTestUtils.setPrivateField(project, "registryIsLoaded", true);

        // load cache
        project.addConnection(ds);

        List<?> connections = project.getConnections();

        // when registry is marked as loaded, it should not be queried again
        Mockito.verify(registry, Mockito.never()).getDataSources();
        Assert.assertNotNull(connections);
        Assert.assertEquals(1, connections.size());
        Assert.assertEquals("ds1", project.getConnections().getFirst().getDataSourceContainer().getId());
    }

}

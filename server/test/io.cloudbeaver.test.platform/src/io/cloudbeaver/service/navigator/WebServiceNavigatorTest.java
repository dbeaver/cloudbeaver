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
package io.cloudbeaver.service.navigator;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebSessionProjectImpl;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebUserContext;
import io.cloudbeaver.server.WebAppSessionManager;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import io.cloudbeaver.server.events.WSObjectSettingsEventHandler;
import io.cloudbeaver.service.navigator.impl.WebServiceNavigator;
import io.cloudbeaver.service.security.SMUtils;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.*;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.auth.SMObjectType;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.navigator.DBNDataSource;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.meta.DBXTreeItem;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.SMObjectSettings;
import org.jkiss.dbeaver.model.struct.DBSInstance;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.DBSObjectFilter;
import org.jkiss.dbeaver.model.struct.rdb.DBSSchema;
import org.jkiss.dbeaver.model.struct.rdb.DBSTable;
import org.jkiss.dbeaver.model.websocket.event.WSObjectSettingsEvent;
import org.jkiss.dbeaver.registry.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class WebServiceNavigatorTest {
    private static final String FILTER_KEY = UserDBSObjectFilterUtils.USER_FILTER_KEY;
    private final WebServiceNavigator service = new WebServiceNavigator();

    @Test
    void personalUpdateRoundTripsAndPreservesOtherSettingsAndFilters() throws Exception {
        Fixture f = new Fixture(true);
        f.seedOtherSettings();
        assertTrue(service.setUserNavigatorNodeFilter(f.session, "node", List.of("mine_%"), List.of("mine_hidden%")));

        DBSObjectFilter local = f.info().getUserFilter();
        assertNotNull(local);
        assertTrue(local.isUserFilter());
        assertTrue(local.isEnabled());
        assertEquals(List.of("mine_%"), local.getInclude());
        assertEquals(List.of("mine_hidden%"), local.getExclude());
        assertSame(local, f.info().getFilter());
        assertTrue(f.info().isUserFiltered());
        var saved = f.serializer.deserializeObjectFilterConfig(f.savedFilters());
        assertEquals(2, saved.size());
        assertTrue(saved.stream().anyMatch(c -> DBSTable.class.getName().equals(c.typeName()) && "schema".equals(c.objectID())));
        assertFalse(f.savedFilters().contains("shared_%"));
        assertEquals("keep", f.settings().get("unrelated"));
        assertEquals(List.of("other_%"), f.dataSource.getObjectFilter(DBSSchema.class, null, true).getInclude());
        String savedFilters = f.savedFilters();
        verify(f.security).setObjectSettings("project", SMObjectType.datasource, "connection", Map.of(FILTER_KEY, savedFilters));
        assertTrue(service.setUserNavigatorNodeFilter(f.session, "node", List.of("updated_%"), null));
        assertEquals(List.of("updated_%"), f.info().getUserFilter().getInclude());
        assertEquals(2, f.serializer.deserializeObjectFilterConfig(f.savedFilters()).size());
        assertFalse(f.savedFilters().contains("mine_%"));
        verify(f.registry, times(3)).refreshConfig(List.of("connection"));
        f.assertNoSharedSave();
    }

    @Test
    void localRemovalPreservesOtherPersonalFiltersAndLastRemovalRestoresShared() throws Exception {
        Fixture f = new Fixture(true);
        f.seedOtherSettings();
        service.setUserNavigatorNodeFilter(f.session, "node", List.of("mine_%"), null);
        assertTrue(service.setUserNavigatorNodeFilter(f.session, "node", List.of(), null));
        assertNull(f.info().getUserFilter());
        assertFalse(f.info().isUserFiltered());
        assertEquals(1, f.serializer.deserializeObjectFilterConfig(f.savedFilters()).size());
        assertSame(f.shared, f.dataSource.getObjectFilter(DBSTable.class, null, true));

        doReturn(DBSSchema.class).when(f.node).getChildrenOrFolderClass(f.meta);
        when(f.node.getValueObject()).thenReturn(null);
        assertTrue(service.setUserNavigatorNodeFilter(f.session, "node", null, List.of()));
        assertFalse(UserDBSObjectFilterUtils.hasUserFilters(f.dataSource));
        assertEquals(Map.of("unrelated", "keep"), f.settings());
        assertSame(f.shared, f.dataSource.getObjectFilter(DBSTable.class, null, true));
        verify(f.security).setObjectSettings("project", SMObjectType.datasource, "connection",
            java.util.Collections.singletonMap(FILTER_KEY, null));
        f.assertNoSharedSave();
    }

    @Test
    void removalWithoutLocalPersonalFilterDoesNotWriteOrRemoveSharedOrInheritedFilter() throws Exception {
        Fixture f = new Fixture(true);
        f.dataSource.setObjectFilter(DBSTable.class, f.parent, f.shared);
        assertTrue(service.setUserNavigatorNodeFilter(f.session, "node", null, null));
        assertSame(f.shared, f.node.getNodeFilter(f.meta, true));
        f.dataSource.setObjectFilter(DBSTable.class, f.parent, null);
        f.dataSource.setObjectFilter(DBSTable.class, null, filter("global_%", true));
        assertTrue(service.setUserNavigatorNodeFilter(f.session, "node", null, null));
        assertTrue(f.info().isUserFiltered());
        assertNull(f.info().getUserFilter());
        verifyNoInteractions(f.security);
        verify(f.registry, never()).refreshConfig(any());
        f.assertNoSharedSave();
    }

    @Test
    void resetUsesExistingSettingsClearAndRestoresOriginalSharedConfiguration() throws Exception {
        Fixture f = new Fixture(true);
        f.seedOtherSettings();
        service.setUserNavigatorNodeFilter(f.session, "node", null, List.of("hidden_%"));
        WebConnectionInfo connection = mock(WebConnectionInfo.class);
        when(connection.getDataSourceContainer()).thenReturn(f.dataSource);
        assertTrue(service.resetUserNavigatorFilters(f.session, connection));
        assertFalse(UserDBSObjectFilterUtils.hasUserFilters(f.dataSource));
        assertEquals(Map.of("unrelated", "keep"), f.settings());
        assertNull(f.dataSource.getObjectFilter(DBSSchema.class, null, true));
        assertSame(f.shared, f.node.getNodeFilter(f.meta, false));
        assertFalse(f.info().isUserFiltered());
        assertNull(f.info().getUserFilter());
        f.assertNoSharedSave();
    }

    @Test
    void failedPersonalSaveRestoresLocalSharedFilterWithoutMutatingIt() throws Exception {
        Fixture f = new Fixture(true);
        f.dataSource.setObjectFilter(DBSTable.class, f.parent, f.shared);
        DBException failure = new DBException("storage unavailable");
        doThrow(failure).when(f.security).setObjectSettings(anyString(), any(), anyString(), anyMap());
        DBWebException error = assertThrows(DBWebException.class,
            () -> service.setUserNavigatorNodeFilter(f.session, "node", List.of("mine_%"), null));
        assertSame(failure, error.getCause());
        assertSame(f.shared, f.node.getNodeFilter(f.meta, true));
        assertEquals(List.of("shared_%"), f.shared.getInclude());
        assertFalse(f.shared.isUserFilter());
        assertFalse(UserDBSObjectFilterUtils.hasUserFilters(f.dataSource));
        verify(f.registry, never()).refreshConfig(any());
        f.assertNoSharedSave();
    }

    @Test
    void anonymousPersonalFiltersRemainSessionLocalAndResettable() throws Exception {
        Fixture first = new Fixture(false);
        Fixture second = new Fixture(false);
        assertTrue(service.setUserNavigatorNodeFilter(first.session, "node", List.of("session_%"), null));
        assertEquals(List.of("session_%"), first.info().getUserFilter().getInclude());
        assertTrue(UserDBSObjectFilterUtils.hasUserFilters(first.dataSource));
        assertNull(second.info().getUserFilter());
        assertFalse(second.info().isUserFiltered());
        assertTrue(service.setUserNavigatorNodeFilter(first.session, "node", null, null));
        assertFalse(UserDBSObjectFilterUtils.hasUserFilters(first.dataSource));
        assertSame(first.shared, first.node.getNodeFilter(first.meta, false));
        verifyNoInteractions(first.security, second.security);
        first.assertNoSharedSave();
        second.assertNoSharedSave();
    }

    @Test
    void effectiveGlobalPersonalFlagIsIndependentOfLocalFilterAndLegacyRead() throws Exception {
        Fixture f = new Fixture(true);
        DBSObjectFilter global = filter("global_%", true);
        f.dataSource.setObjectFilter(DBSTable.class, null, global);
        assertTrue(f.info().isUserFiltered());
        assertNull(f.info().getUserFilter());
        assertNull(f.info().getFilter());
        DBSObjectFilter disabled = filter("disabled_%", true);
        disabled.setEnabled(false);
        DBSObjectFilter empty = new DBSObjectFilter();
        empty.setUserFilter(true);
        for (DBSObjectFilter inactive : List.of(disabled, empty)) {
            f.dataSource.setObjectFilter(DBSTable.class, f.parent, inactive);
            f.dataSource.setObjectFilter(DBSTable.class, null, f.shared);
            assertFalse(f.info().isUserFiltered());
            assertNull(f.info().getUserFilter());
            assertNull(f.info().getFilter());
        }
        f.dataSource.setObjectFilter(DBSTable.class, f.parent, f.shared);
        assertSame(f.shared, f.info().getFilter());
        assertFalse(f.info().isUserFiltered());
        assertNull(f.info().getUserFilter());
    }

    @Test
    void unsupportedNodesAndMissingSettingsFailBeforeChangingSharedFilter() throws Exception {
        Fixture f = new Fixture(true);
        doReturn(null).when(f.node).getChildrenOrFolderClass(f.meta);
        assertThrows(DBWebException.class,
            () -> service.setUserNavigatorNodeFilter(f.session, "node", List.of("mine_%"), null));
        doReturn(DBSTable.class).when(f.node).getChildrenOrFolderClass(f.meta);
        doReturn(null).when(f.project).getAdapter(DBPObjectSettingsProvider.class);
        assertThrows(DBWebException.class,
            () -> service.setUserNavigatorNodeFilter(f.session, "node", List.of("mine_%"), null));
        assertSame(f.shared, f.dataSource.getObjectFilter(DBSTable.class, null, true));
        verifyNoInteractions(f.security);
        f.assertNoSharedSave();
        DBNNode plain = mock(DBNNode.class);
        when(f.model.getNodeByPath(f.session.getProgressMonitor(), "plain")).thenReturn(plain);
        WebNavigatorNodeInfo info = new WebNavigatorNodeInfo(f.session, plain);
        assertFalse(info.isUserFiltered());
        assertNull(info.getUserFilter());
        assertThrows(DBWebException.class, info::getFilter);
        assertThrows(DBWebException.class,
            () -> service.setUserNavigatorNodeFilter(f.session, "plain", List.of("mine_%"), null));
        assertTrue(service.setNavigatorNodeFilter(f.session, "plain", null, null));
    }

    @Test
    void legacyMutationKeepsDevelSaveFlagReturnAndPermissionBehavior() throws Exception {
        Fixture f = new Fixture(false);
        try (MockedStatic<SMUtils> permissions = mockStatic(SMUtils.class)) {
            DBNDataSource node = mock(DBNDataSource.class);
            when(f.model.getNodeByPath(f.session.getProgressMonitor(), "legacy")).thenReturn(node);
            when(node.getOwnerProject()).thenReturn(f.project);
            when(node.getDataSourceContainer()).thenReturn(f.dataSource);
            when(node.getItemsMeta()).thenReturn(f.meta);
            for (boolean allowed : List.of(false, true)) {
                permissions.when(() -> SMUtils.hasProjectPermission(
                    f.session, f.project.getRMProject(), RMProjectPermission.DATA_SOURCES_EDIT)).thenReturn(allowed);
                // The legacy API returns true even when setNodeFilter returns false.
                assertTrue(service.setNavigatorNodeFilter(f.session, "legacy", List.of("legacy_%"), List.of("hidden_%")));
            }
            ArgumentCaptor<DBSObjectFilter> filters = ArgumentCaptor.forClass(DBSObjectFilter.class);
            verify(node, times(2)).setNodeFilter(eq(f.meta), filters.capture(), eq(true));
            for (DBSObjectFilter filter : filters.getAllValues()) {
                assertFalse(filter.isUserFilter());
                assertTrue(filter.isEnabled());
                assertEquals(List.of("legacy_%"), filter.getInclude());
                assertEquals(List.of("hidden_%"), filter.getExclude());
            }
            verify(f.registry).updateDataSource(f.dataSource, true);
            verifyNoInteractions(f.security);
            assertFalse(UserDBSObjectFilterUtils.hasUserFilters(f.dataSource));
        }
    }

    @Test
    void objectSettingsEventsReachOnlyOtherSessionsOfTheSameUser() throws Exception {
        Fixture origin = new Fixture(true);
        Fixture sibling = new Fixture(true);
        Fixture other = new Fixture(true);
        try (MockedStatic<WebAppUtils> apps = mockStatic(WebAppUtils.class)) {
            origin.identity("alice", "origin");
            sibling.identity("alice", "sibling");
            other.identity("bob", "other");
            service.setUserNavigatorNodeFilter(origin.session, "node", List.of("alice_%"), null);
            sibling.settings(); // Load the real BaseProjectSettings cache before a remote update.
            var remoteSettings = new SMObjectSettings(SMObjectType.datasource, "connection", Map.of(FILTER_KEY, origin.savedFilters()));
            when(sibling.security.getObjectSettings(eq("project"), eq(SMObjectType.datasource), eq("connection"), any()))
                .thenReturn(List.of(remoteSettings));
            WebApplication application = mock(WebApplication.class);
            WebAppSessionManager sessions = mock(WebAppSessionManager.class);
            apps.when(WebAppUtils::isWebApplication).thenReturn(true);
            apps.when(WebAppUtils::getWebApplication).thenReturn(application);
            when(application.getSessionManager()).thenReturn(sessions);
            when(sessions.getAllActiveSessions()).thenReturn(List.of(origin.session, sibling.session, other.session));
            var update = WSObjectSettingsEvent.update("origin", "alice", SMObjectType.datasource,
                "project", "connection", Set.of(FILTER_KEY));
            var handler = new WSObjectSettingsEventHandler();
            handler.handleEvent(update);
            assertEquals(List.of("alice_%"), sibling.info().getUserFilter().getInclude());
            assertNull(other.info().getUserFilter());
            verify(sibling.session).addSessionEvent(update);
            verify(origin.session, never()).addSessionEvent(any());
            verify(other.session, never()).addSessionEvent(any());
            verifyNoInteractions(other.security);
            var delete = WSObjectSettingsEvent.delete("origin", "alice", SMObjectType.datasource,
                "project", "connection", Set.of(FILTER_KEY));
            handler.handleEvent(delete);
            assertFalse(sibling.info().isUserFiltered());
            assertNull(sibling.info().getUserFilter());
            assertSame(sibling.shared, sibling.node.getNodeFilter(sibling.meta, false));
            assertNotNull(origin.info().getUserFilter());
            verify(sibling.session).addSessionEvent(delete);
            sibling.assertNoSharedSave();
            other.assertNoSharedSave();
        }
    }

    private static DBSObjectFilter filter(String include, boolean personal) {
        DBSObjectFilter filter = new DBSObjectFilter();
        filter.addInclude(include);
        filter.setUserFilter(personal);
        return filter;
    }

    private static class Fixture {
        final WebSession session = mock(WebSession.class);
        final WebUserContext user = mock(WebUserContext.class);
        final SMController security = mock(SMController.class);
        final DBNModel model = mock(DBNModel.class);
        final DBNDatabaseNode node = mock(DBNDatabaseNode.class);
        final DBXTreeItem meta = mock(DBXTreeItem.class);
        final DataSourceRegistry<?> registry = mock(DataSourceRegistry.class);
        final FilterSerializer<DataSourceDescriptor> serializer = new FilterSerializer<>();
        final DBSObjectFilter shared = filter("shared_%", false);
        final DBSObject parent = mock(DBSObject.class, withSettings().extraInterfaces(DBPQualifiedObject.class));
        final WebSessionProjectImpl project;
        final DataSourceDescriptor dataSource;

        Fixture(boolean authorized) throws Exception {
            when(session.getUserContext()).thenReturn(user);
            when(user.isNonAnonymousUserAuthorizedInSM()).thenReturn(authorized);
            when(session.getSecurityController()).thenReturn(security);
            when(session.getSessionContext()).thenReturn(mock(SMSessionContext.class));
            RMProject rmProject = mock(RMProject.class);
            when(rmProject.getId()).thenReturn("project");
            project = spy(new WebSessionProjectImpl(session, rmProject, Path.of("navigator-test")) {
                @Override
                public DBPDataSourceRegistry getDataSourceRegistry() {
                    return registry;
                }
            });
            when(registry.getProject()).thenReturn(project);
            // Only product defaults require an application; the descriptor and its filter mapping are real.
            try (MockedStatic<DataSourceNavigatorSettings> defaults = mockStatic(DataSourceNavigatorSettings.class)) {
                defaults.when(DataSourceNavigatorSettings::getDefaultSettings).thenReturn(new DataSourceNavigatorSettings());
                dataSource = new DataSourceDescriptor(registry, mock(DBPDataSourceConfigurationStorage.class),
                    DataSourceOriginLocal.INSTANCE, "connection", mock(DBPDriver.class), new DBPConnectionConfiguration());
            }
            when(registry.getDataSource("connection")).thenReturn(dataSource);
            dataSource.setObjectFilter(DBSTable.class, null, shared);
            // Model the registry's configuration reload: shared config first, then the actual saved personal JSON.
            doAnswer(invocation -> {
                dataSource.getObjectFilters().clear();
                dataSource.setObjectFilter(DBSTable.class, null, shared);
                UserDBSObjectFilterUtils.setUserObjectFilters(dataSource, settings());
                return null;
            }).when(registry).refreshConfig(List.of("connection"));
            when(session.getProjectById("project")).thenReturn(project);
            when(session.getNavigatorModelOrThrow()).thenReturn(model);
            when(model.getNodeByPath(session.getProgressMonitor(), "node")).thenReturn(node);
            when(node.getDataSourceContainer()).thenReturn(dataSource);
            when(node.getValueObject()).thenReturn(parent);
            when(node.getItemsMeta()).thenReturn(meta);
            doReturn(DBSTable.class).when(node).getChildrenOrFolderClass(meta);
            when(node.getNodeUri()).thenReturn("node://node");
            doCallRealMethod().when(node).getNodeFilter(any(), anyBoolean());
            doCallRealMethod().when(node).setNodeFilter(any(), any(), anyBoolean());
            doCallRealMethod().when(node).getFilterObject();
            DBPDataSource database = mock(DBPDataSource.class);
            DBSInstance instance = mock(DBSInstance.class);
            when(database.getName()).thenReturn("database");
            when(instance.getName()).thenReturn("database");
            when(parent.getDataSource()).thenReturn(database);
            when(parent.getParentObject()).thenReturn(instance);
            when(((DBPQualifiedObject) parent).getFullyQualifiedName(DBPEvaluationContext.UI)).thenReturn("schema");
        }

        WebNavigatorNodeInfo info() {
            return new WebNavigatorNodeInfo(session, node);
        }

        Map<String, String> settings() {
            Map<String, String> settings = project.getProjectSettings().getObjectSettings(SMObjectType.datasource, "connection");
            return settings == null ? Map.of() : settings;
        }

        String savedFilters() {
            return settings().get(FILTER_KEY);
        }

        void seedOtherSettings() throws Exception {
            settings();
            dataSource.setObjectFilter(DBSSchema.class, null, filter("other_%", true));
            project.getProjectSettings().setObjectSettings(SMObjectType.datasource, "connection",
                Map.of("unrelated", "keep", FILTER_KEY, serializer.serializeCustomUserFilters(dataSource)));
        }

        void identity(String userId, String sessionId) {
            when(user.getUserId()).thenReturn(userId);
            when(user.getSmSessionId()).thenReturn(sessionId);
        }

        void assertNoSharedSave() throws Exception {
            verify(registry, never()).updateDataSource(any(), anyBoolean());
        }

    }
}

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
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.navigator.DBNDataSource;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.meta.DBXTreeItem;
import org.jkiss.dbeaver.model.rm.RMController;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;

import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class WebServiceNavigatorTest {
    private static final String FILTER_KEY = UserDBSObjectFilterUtils.USER_FILTER_KEY;
    private final WebServiceNavigator service = new WebServiceNavigator();
    private MockedStatic<DataSourceNavigatorSettings> defaults;

    @BeforeEach
    void mockNavigatorDefaults() {
        // Both live descriptors and unregistered lookup descriptors need product defaults, not a running application.
        defaults = mockStatic(DataSourceNavigatorSettings.class);
        defaults.when(DataSourceNavigatorSettings::getDefaultSettings).thenReturn(new DataSourceNavigatorSettings());
    }

    @AfterEach
    void closeNavigatorDefaults() {
        defaults.close();
    }

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
        // The personal getter now deserializes an independent saved-settings snapshot.
        DBSObjectFilter runtime = f.node.getNodeFilter(f.meta, true);
        assertNotSame(local, runtime);
        assertEquals(local, runtime);
        assertTrue(runtime.isUserFilter());
        assertNull(f.info().getFilter());
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
        assertEquals(List.of("global_%"), f.node.getNodeFilter(f.meta, false).getInclude());
        assertNull(f.info().getUserFilter());
        verifyNoInteractions(f.security);
        verify(f.registry, never()).refreshConfig(any());
        f.assertNoSharedSave();
    }

    @Test
    void resetUsesExistingSettingsClearAndRestoresOriginalSharedConfiguration() throws Exception {
        Fixture f = new Fixture(true);
        f.localShared();
        f.seedOtherSettings();
        service.setUserNavigatorNodeFilter(f.session, "node", null, List.of("hidden_%"));
        DBSObjectFilter connectionBeforeReset = f.info().getFilter();
        assertFilter(connectionBeforeReset, false, "shared_%", "shared_hidden%");
        assertFilter(f.info().getUserFilter(), true, null, "hidden_%");
        WebConnectionInfo connection = mock(WebConnectionInfo.class);
        when(connection.getDataSourceContainer()).thenReturn(f.dataSource);
        assertTrue(service.resetUserNavigatorFilters(f.session, connection));
        assertFalse(UserDBSObjectFilterUtils.hasUserFilters(f.dataSource));
        assertEquals(Map.of("unrelated", "keep"), f.settings());
        assertNull(f.dataSource.getObjectFilter(DBSSchema.class, null, true));
        assertSame(f.shared, f.node.getNodeFilter(f.meta, false));
        assertNull(f.info().getUserFilter());
        assertEquals(connectionBeforeReset, f.info().getFilter());
        assertSame(f.shared, f.node.getNodeFilter(f.meta, true));
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
        assertSame(second.shared, second.node.getNodeFilter(second.meta, false));
        assertTrue(service.setUserNavigatorNodeFilter(first.session, "node", null, null));
        assertFalse(UserDBSObjectFilterUtils.hasUserFilters(first.dataSource));
        assertSame(first.shared, first.node.getNodeFilter(first.meta, false));
        verifyNoInteractions(first.security, second.security);
        first.assertNoSharedSave();
        second.assertNoSharedSave();
    }

    @Test
    void runtimeFiltersRemainIndependentOfSavedLocalFilterGetters() throws Exception {
        Fixture f = new Fixture(true);
        DBSObjectFilter global = filter("global_%", true);
        f.dataSource.setObjectFilter(DBSTable.class, null, global);
        assertSame(global, f.node.getNodeFilter(f.meta, false));
        assertNull(f.info().getUserFilter());
        assertNull(f.info().getFilter());
        DBSObjectFilter disabled = filter("disabled_%", true);
        disabled.setEnabled(false);
        DBSObjectFilter empty = new DBSObjectFilter();
        empty.setUserFilter(true);
        for (DBSObjectFilter inactive : List.of(disabled, empty)) {
            f.dataSource.setObjectFilter(DBSTable.class, f.parent, inactive);
            f.dataSource.setObjectFilter(DBSTable.class, null, f.shared);
            assertSame(f.shared, f.node.getNodeFilter(f.meta, false));
            assertSame(inactive, f.node.getNodeFilter(f.meta, true));
            assertNull(f.info().getUserFilter());
            assertNull(f.info().getFilter());
        }
        f.dataSource.setObjectFilter(DBSTable.class, f.parent, f.shared);
        assertSame(f.shared, f.node.getNodeFilter(f.meta, true));
        assertNull(f.info().getFilter());
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
            assertNull(sibling.info().getUserFilter());
            assertSame(sibling.shared, sibling.node.getNodeFilter(sibling.meta, false));
            assertNotNull(origin.info().getUserFilter());
            verify(sibling.session).addSessionEvent(delete);
            sibling.assertNoSharedSave();
            other.assertNoSharedSave();
        }
    }

    @Test
    void personalOnlyDoesNotAppearAsConnectionFilter() throws Exception {
        Fixture f = new Fixture(true);
        f.connectionFilters(List.of());
        f.sharedGlobal = false;
        f.dataSource.getObjectFilters().clear();
        assertTrue(service.setUserNavigatorNodeFilter(f.session, "node", List.of("personal_%"), List.of("personal_hidden%")));

        DBSObjectFilter runtime = f.node.getNodeFilter(f.meta, true);
        assertFilter(runtime, true, "personal_%", "personal_hidden%");
        assertFilter(f.info().getUserFilter(), true, "personal_%", "personal_hidden%");
        assertNull(f.info().getFilter());
        assertSame(runtime, f.node.getNodeFilter(f.meta, true));
        assertNull(f.dataSource.getObjectFilter(DBSTable.class, null, true));
        f.assertNoSharedSave();
    }

    @Test
    void connectionAndPersonalFiltersAtSameParentKeepDistinctMasksAndPersonalRuntime() throws Exception {
        Fixture f = new Fixture(true);
        f.localShared();
        f.savePersonalFilters(List.of(filterConfig("schema", "personal_%", "personal_hidden%")));
        DBSObjectFilter runtime = f.node.getNodeFilter(f.meta, true);

        DBSObjectFilter connection = f.info().getFilter();
        DBSObjectFilter personal = f.info().getUserFilter();
        assertFilter(connection, false, "shared_%", "shared_hidden%");
        assertFilter(personal, true, "personal_%", "personal_hidden%");
        assertNotSame(connection, personal);
        assertNotSame(runtime, personal);
        assertFilter(runtime, true, "personal_%", "personal_hidden%");
        assertSame(runtime, f.node.getNodeFilter(f.meta, true));
        assertEquals("schema", f.serializer.deserializeObjectFilterConfig(f.savedFilters()).getFirst().objectID());
        verify(f.rm).getProjectsDataSources("project", new String[] {"connection"});
        f.assertNoSharedSave();
    }

    @Test
    void sharedOnlyReadsCanonicalLocalTableFilterAmongOtherAdminFilters() throws Exception {
        Fixture f = new Fixture(true);
        f.localShared();

        assertFilter(f.info().getFilter(), false, "shared_%", "shared_hidden%");
        assertNull(f.info().getUserFilter());
        assertSame(f.shared, f.node.getNodeFilter(f.meta, true));
        assertFalse(f.shared.isUserFilter());
        verifyNoInteractions(f.security);
        verify(f.registry, never()).refreshConfig(any());
        f.assertNoSharedSave();
    }

    @Test
    void twoNodesResolveTheirOwnLocalScopesFromBothSavedSources() throws Exception {
        Fixture f = new Fixture(true);
        DBNDatabaseNode second = f.node("second", "other_schema");
        WebNavigatorNodeInfo secondInfo = new WebNavigatorNodeInfo(f.session, second);
        f.connectionFilters(List.of(
            filterConfig("schema", "shared_first_%", "shared_first_hidden%"),
            filterConfig("other_schema", "shared_second_%", "shared_second_hidden%")));
        f.savePersonalFilters(List.of(
            filterConfig("schema", "personal_first_%", "personal_first_hidden%"),
            filterConfig("other_schema", "personal_second_%", "personal_second_hidden%")));

        assertFilter(f.info().getFilter(), false, "shared_first_%", "shared_first_hidden%");
        assertFilter(f.info().getUserFilter(), true, "personal_first_%", "personal_first_hidden%");
        assertFilter(secondInfo.getFilter(), false, "shared_second_%", "shared_second_hidden%");
        assertFilter(secondInfo.getUserFilter(), true, "personal_second_%", "personal_second_hidden%");
        DBSObjectFilter secondRuntime = second.getNodeFilter(f.meta, true);
        assertFilter(f.node.getNodeFilter(f.meta, true), true, "personal_first_%", "personal_first_hidden%");
        assertFilter(secondRuntime, true, "personal_second_%", "personal_second_hidden%");
        assertTrue(service.setUserNavigatorNodeFilter(f.session, "node", List.of("updated_first_%"), null));
        assertFilter(f.info().getUserFilter(), true, "updated_first_%", null);
        assertFilter(f.node.getNodeFilter(f.meta, true), true, "updated_first_%", null);
        assertFilter(secondInfo.getUserFilter(), true, "personal_second_%", "personal_second_hidden%");
        assertEquals(secondRuntime, second.getNodeFilter(f.meta, true));
        assertEquals(2, f.serializer.deserializeObjectFilterConfig(f.savedFilters()).size());
        assertFilter(f.info().getFilter(), false, "shared_first_%", "shared_first_hidden%");
        assertFilter(secondInfo.getFilter(), false, "shared_second_%", "shared_second_hidden%");
        f.assertNoSharedSave();
    }

    @Test
    void savedGlobalFiltersRemainEffectiveButDoNotLeakIntoLocalGetters() throws Exception {
        Fixture f = new Fixture(true);
        f.connectionFilters(List.of(filterConfig(null, "shared_global_%", null)));
        f.savePersonalFilters(List.of(filterConfig(null, "personal_global_%", "global_hidden%")));
        DBSObjectFilter inherited = f.node.getNodeFilter(f.meta, false);

        assertFilter(inherited, true, "personal_global_%", "global_hidden%");
        assertNull(f.info().getUserFilter());
        assertNull(f.info().getFilter());
        assertNull(f.node.getNodeFilter(f.meta, true));
        assertSame(inherited, f.node.getNodeFilter(f.meta, false));
        f.assertNoSharedSave();
    }

    @Test
    void savedPersonalFilterSurvivesRuntimeMapBeingOverwrittenWithSharedFilter() throws Exception {
        Fixture f = new Fixture(true);
        f.localShared();
        f.savePersonalFilters(List.of(filterConfig("schema", "saved_personal_%", "saved_hidden%")));
        String saved = f.savedFilters();
        f.dataSource.setObjectFilter(DBSTable.class, f.parent, f.shared);

        assertSame(f.shared, f.node.getNodeFilter(f.meta, true));
        assertFilter(f.info().getUserFilter(), true, "saved_personal_%", "saved_hidden%");
        assertFilter(f.info().getFilter(), false, "shared_%", "shared_hidden%");
        assertEquals(saved, f.savedFilters());
        assertSame(f.shared, f.node.getNodeFilter(f.meta, true));
        f.assertNoSharedSave();
    }

    @Test
    void inactiveSavedLocalFiltersDoNotFallBackToActiveGlobalFilters() throws Exception {
        Fixture f = new Fixture(true);
        Map<String, Object> disabled = filterConfig("schema", "disabled_%", null);
        disabled.put("enabled", false);
        Map<String, Object> empty = filterConfig("schema", null, null);
        for (Map<String, Object> inactive : List.of(disabled, empty)) {
            f.connectionFilters(List.of(filterConfig(null, "shared_global_%", null), inactive));
            f.savePersonalFilters(List.of(filterConfig(null, "personal_global_%", null), inactive));
            assertNull(f.info().getFilter());
            assertNull(f.info().getUserFilter());
            DBSObjectFilter runtime = f.node.getNodeFilter(f.meta, true);
            assertNotNull(runtime);
            assertTrue(runtime.isUserFilter());
            assertTrue(runtime.isEmpty() || !runtime.isEnabled());
            assertFilter(f.node.getNodeFilter(f.meta, false), true, "personal_global_%", null);
        }
        f.assertNoSharedSave();
    }

    @Test
    void repeatedGettersDoNotChangeLiveStateRefreshRegistryOrCopyCredentials() throws Exception {
        Fixture f = new Fixture(true);
        f.localShared();
        f.savePersonalFilters(List.of(filterConfig("schema", "personal_%", "personal_hidden%")));
        DBPConnectionConfiguration credentials = f.dataSource.getConnectionConfiguration();
        credentials.setUserName("live-user");
        credentials.setUserPassword("live-password");
        credentials.setUrl("jdbc:test:live");
        credentials.setProperty("live-property", "live-value");
        credentials.setAuthProperties(Map.of("live-auth", "live-secret"));
        DBSObjectFilter runtime = f.node.getNodeFilter(f.meta, true);
        List<FilterMapping> mappings = List.copyOf(f.dataSource.getObjectFilters());
        Map<String, String> settings = Map.copyOf(f.settings());
        var navigatorSettings = f.dataSource.getNavigatorSettings();
        clearInvocations(f.dataSource, f.registry, f.security, f.rm);
        doThrow(new AssertionError("Filter reads must not access live credentials"))
            .when(f.dataSource).getConnectionConfiguration();

        // Inspect the real unregistered scratch descriptor while retaining the real settings loader.
        try (MockedStatic<UserDBSObjectFilterUtils> userFilters = mockStatic(UserDBSObjectFilterUtils.class, CALLS_REAL_METHODS)) {
            userFilters.when(() -> UserDBSObjectFilterUtils.setUserObjectFilters(any(), anyMap())).thenAnswer(invocation -> {
                DataSourceDescriptor scratch = invocation.getArgument(0);
                assertNotSame(f.dataSource, scratch);
                DBPConnectionConfiguration empty = scratch.getConnectionConfiguration();
                assertNull(empty.getUserName());
                assertNull(empty.getUserPassword());
                assertNull(empty.getUrl());
                assertTrue(empty.getProperties().isEmpty());
                assertTrue(empty.getAuthProperties().isEmpty());
                return invocation.callRealMethod();
            });
            for (int i = 0; i < 3; i++) {
                DBSObjectFilter connection = f.info().getFilter();
                DBSObjectFilter personal = f.info().getUserFilter();
                assertFilter(connection, false, "shared_%", "shared_hidden%");
                assertFilter(personal, true, "personal_%", "personal_hidden%");
                assertSame(runtime, f.node.getNodeFilter(f.meta, true));
                // Mutating a returned snapshot must affect neither the next read nor the runtime mapping.
                connection.setInclude(List.of("changed_shared_%"));
                personal.setInclude(List.of("changed_personal_%"));
            }
            userFilters.verify(() -> UserDBSObjectFilterUtils.setUserObjectFilters(any(), anyMap()), times(3));
        }

        List<FilterMapping> after = List.copyOf(f.dataSource.getObjectFilters());
        assertEquals(mappings.size(), after.size());
        for (int i = 0; i < mappings.size(); i++) {
            assertSame(mappings.get(i), after.get(i));
        }
        assertEquals(settings, f.settings());
        assertSame(navigatorSettings, f.dataSource.getNavigatorSettings());
        assertFilter(runtime, true, "personal_%", "personal_hidden%");
        assertSame(runtime, f.node.getNodeFilter(f.meta, true));
        assertEquals("live-user", credentials.getUserName());
        assertEquals("live-password", credentials.getUserPassword());
        assertEquals("jdbc:test:live", credentials.getUrl());
        assertEquals(Map.of("live-property", "live-value"), credentials.getProperties());
        assertEquals(Map.of("live-auth", "live-secret"), credentials.getAuthProperties());
        verify(f.dataSource, never()).getConnectionConfiguration();
        verify(f.dataSource, never()).setObjectFilter(any(Class.class), any(), any());
        verify(f.registry, atLeastOnce()).getPreferenceStore();
        verify(f.registry, atLeastOnce()).getProject();
        verifyNoMoreInteractions(f.registry);
        verify(f.rm, times(3)).getProjectsDataSources("project", new String[] {"connection"});
        verifyNoInteractions(f.security);
        f.assertNoSharedSave();
    }

    @Test
    void resourceManagerFailurePropagatesInsteadOfReturningLiveFilter() throws Exception {
        Fixture f = new Fixture(true);
        f.localShared();
        f.savePersonalFilters(List.of(filterConfig("schema", "personal_%", null)));
        DBException failure = new DBException("canonical configuration unavailable");
        when(f.rm.getProjectsDataSources("project", new String[] {"connection"})).thenThrow(failure);
        DBSObjectFilter runtime = f.node.getNodeFilter(f.meta, true);
        assertFilter(runtime, true, "personal_%", null);

        DBWebException error = assertThrows(DBWebException.class, () -> f.info().getFilter());
        assertSame(failure, error.getCause());
        assertSame(runtime, f.node.getNodeFilter(f.meta, true));
        assertFilter(f.info().getUserFilter(), true, "personal_%", null);
        f.assertNoSharedSave();
    }

    @Test
    void hiddenDraftReturnsOnlyACopyOfNonPersonalLocalRuntimeFilter() throws Exception {
        assertSessionOnlyConnectionFilter(true);
    }

    @Test
    void inMemoryProjectReturnsOnlyACopyOfNonPersonalLocalRuntimeFilter() throws Exception {
        assertSessionOnlyConnectionFilter(false);
    }

    private void assertSessionOnlyConnectionFilter(boolean hidden) throws Exception {
        Fixture f = new Fixture(true);
        f.localShared();
        if (hidden) {
            f.dataSource.setHidden(true);
        } else {
            doReturn(true).when(f.project).isInMemory();
        }
        DBSObjectFilter connection = f.info().getFilter();
        assertFilter(connection, false, "shared_%", "shared_hidden%");
        assertNotSame(f.shared, connection);
        connection.setInclude(List.of("changed_%"));
        assertEquals(List.of("shared_%"), f.shared.getInclude());
        f.savePersonalFilters(List.of(filterConfig("schema", "personal_%", null)));
        assertNull(f.info().getFilter());
        assertFilter(f.info().getUserFilter(), true, "personal_%", null);
        assertFilter(f.node.getNodeFilter(f.meta, true), true, "personal_%", null);
        f.dataSource.setObjectFilter(DBSTable.class, f.parent, null);
        assertNull(f.info().getFilter()); // The remaining shared global filter is not local.
        assertNull(f.node.getNodeFilter(f.meta, true));
        assertSame(f.shared, f.node.getNodeFilter(f.meta, false));
        verifyNoInteractions(f.rm);
        f.assertNoSharedSave();
    }

    private static void assertFilter(DBSObjectFilter filter, boolean personal, String include, String exclude) {
        assertNotNull(filter);
        assertEquals(personal, filter.isUserFilter());
        assertTrue(filter.isEnabled());
        assertEquals(include == null ? List.of() : List.of(include), filter.getInclude());
        assertEquals(exclude == null ? List.of() : List.of(exclude), filter.getExclude());
    }

    private static Map<String, Object> filterConfig(String parent, String include, String exclude) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("type", DBSTable.class.getName());
        if (parent != null) {
            config.put("id", parent);
        }
        config.put("enabled", true);
        config.put("include", include == null ? List.of() : List.of(include));
        config.put("exclude", exclude == null ? List.of() : List.of(exclude));
        return config;
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
        final RMController rm = mock(RMController.class);
        final DBNModel model = mock(DBNModel.class);
        final DBNDatabaseNode node = mock(DBNDatabaseNode.class);
        final DBXTreeItem meta = mock(DBXTreeItem.class);
        final DataSourceRegistry<?> registry = mock(DataSourceRegistry.class);
        final FilterSerializer<DataSourceDescriptor> serializer = new FilterSerializer<>();
        final DBSObjectFilter shared = filter("shared_%", false);
        final DBSObject parent = mock(DBSObject.class, withSettings().extraInterfaces(DBPQualifiedObject.class));
        final WebSessionProjectImpl project;
        final DataSourceDescriptor dataSource;
        boolean sharedGlobal = true;
        boolean sharedLocal;

        Fixture(boolean authorized) throws Exception {
            when(session.getUserContext()).thenReturn(user);
            when(user.isNonAnonymousUserAuthorizedInSM()).thenReturn(authorized);
            when(session.getSecurityController()).thenReturn(security);
            when(session.getRmController()).thenReturn(rm);
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
            dataSource = spy(new DataSourceDescriptor(registry, mock(DBPDataSourceConfigurationStorage.class),
                DataSourceOriginLocal.INSTANCE, "connection", mock(DBPDriver.class), new DBPConnectionConfiguration()));
            connectionFilters(List.of(filterConfig(null, "shared_%", null)));
            when(registry.getDataSource("connection")).thenReturn(dataSource);
            dataSource.setObjectFilter(DBSTable.class, null, shared);
            // Model the registry's configuration reload: shared config first, then the actual saved personal JSON.
            doAnswer(invocation -> {
                dataSource.getObjectFilters().clear();
                if (sharedGlobal) {
                    dataSource.setObjectFilter(DBSTable.class, null, shared);
                }
                if (sharedLocal) {
                    dataSource.setObjectFilter(DBSTable.class, parent, shared);
                }
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

        void connectionFilters(List<Map<String, Object>> filters) throws Exception {
            when(rm.getProjectsDataSources("project", new String[] {"connection"})).thenReturn(
                JSONUtils.GSON.toJson(Map.of("connections", Map.of("connection", Map.of("filters", filters)))));
        }

        void localShared() throws Exception {
            sharedLocal = true;
            shared.addExclude("shared_hidden%");
            dataSource.setObjectFilter(DBSTable.class, parent, shared);
            connectionFilters(List.of(
                filterConfig("unrelated_schema", "other_shared_%", null),
                filterConfig("schema", "shared_%", "shared_hidden%")));
        }

        void savePersonalFilters(List<Map<String, Object>> filters) throws Exception {
            settings();
            project.getProjectSettings().setObjectSettings(SMObjectType.datasource, "connection",
                Map.of(FILTER_KEY, JSONUtils.GSON.toJson(filters)));
        }

        DBNDatabaseNode node(String path, String schema) throws Exception {
            DBNDatabaseNode other = mock(DBNDatabaseNode.class);
            DBSObject otherParent = mock(DBSObject.class, withSettings().extraInterfaces(DBPQualifiedObject.class));
            DBPDataSource database = parent.getDataSource();
            DBSObject instance = parent.getParentObject();
            when(otherParent.getDataSource()).thenReturn(database);
            when(otherParent.getParentObject()).thenReturn(instance);
            when(((DBPQualifiedObject) otherParent).getFullyQualifiedName(DBPEvaluationContext.UI)).thenReturn(schema);
            when(model.getNodeByPath(session.getProgressMonitor(), path)).thenReturn(other);
            when(other.getDataSourceContainer()).thenReturn(dataSource);
            when(other.getValueObject()).thenReturn(otherParent);
            when(other.getItemsMeta()).thenReturn(meta);
            doReturn(DBSTable.class).when(other).getChildrenOrFolderClass(meta);
            when(other.getNodeUri()).thenReturn("node://" + path);
            doCallRealMethod().when(other).getNodeFilter(any(), anyBoolean());
            doCallRealMethod().when(other).getFilterObject();
            return other;
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

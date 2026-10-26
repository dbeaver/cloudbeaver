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

import io.cloudbeaver.BaseWebProjectImpl;
import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.DBWebExceptionAccessDenied;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebUserContext;
import io.cloudbeaver.service.navigator.impl.WebServiceNavigator;
import io.cloudbeaver.service.security.SMUtils;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNUtils;
import org.jkiss.dbeaver.model.navigator.meta.DBXTreeItem;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.dbeaver.model.struct.DBSObjectFilter;
import org.jkiss.dbeaver.registry.UserDBSObjectFilterUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.util.List;

public class WebServiceNavigatorTest extends CloudbeaverMockTest {

    @Test
    void legacyMutationStoresUserFilterWithoutDataSourceEditPermission() throws Exception {
        WebSession session = Mockito.mock(WebSession.class);
        WebUserContext userContext = Mockito.mock(WebUserContext.class);
        DBNModel navigatorModel = Mockito.mock(DBNModel.class);
        DBNDatabaseNode node = Mockito.mock(DBNDatabaseNode.class);
        BaseWebProjectImpl project = Mockito.mock(BaseWebProjectImpl.class);
        RMProject rmProject = Mockito.mock(RMProject.class);
        DBPDataSourceContainer dataSource = Mockito.mock(DBPDataSourceContainer.class);
        DBXTreeItem itemsMeta = Mockito.mock(DBXTreeItem.class);

        Mockito.when(session.getUserContext()).thenReturn(userContext);
        Mockito.when(userContext.isNonAnonymousUserAuthorizedInSM()).thenReturn(true);
        Mockito.when(session.getNavigatorModelOrThrow()).thenReturn(navigatorModel);
        Mockito.when(navigatorModel.getNodeByPath(session.getProgressMonitor(), "node")).thenReturn(node);
        Mockito.when(node.getOwnerProject()).thenReturn(project);
        Mockito.when(node.getDataSourceContainer()).thenReturn(dataSource);
        Mockito.when(project.getRMProject()).thenReturn(rmProject);

        try (MockedStatic<SMUtils> smUtils = Mockito.mockStatic(SMUtils.class);
             MockedStatic<DBNUtils> dbnUtils = Mockito.mockStatic(DBNUtils.class);
             MockedStatic<UserDBSObjectFilterUtils> filterUtils = Mockito.mockStatic(UserDBSObjectFilterUtils.class)) {
            smUtils.when(() -> SMUtils.hasProjectPermission(
                session,
                rmProject,
                RMProjectPermission.DATA_SOURCES_EDIT
            )).thenReturn(false);
            dbnUtils.when(() -> DBNUtils.getValidItemsMeta(session.getProgressMonitor(), node)).thenReturn(itemsMeta);
            Mockito.when(node.setUserNodeFilter(Mockito.eq(itemsMeta), Mockito.any())).thenReturn(true);

            Assertions.assertTrue(
                new WebServiceNavigator().setNavigatorNodeFilter(session, "node", List.of("prod_%"), null)
            );

            ArgumentCaptor<DBSObjectFilter> filterCaptor = ArgumentCaptor.forClass(DBSObjectFilter.class);
            Mockito.verify(node).setUserNodeFilter(Mockito.eq(itemsMeta), filterCaptor.capture());
            Assertions.assertEquals(List.of("prod_%"), filterCaptor.getValue().getInclude());
            Assertions.assertTrue(filterCaptor.getValue().isUserFilter());
            filterUtils.verify(() -> UserDBSObjectFilterUtils.updateUserObjectFilters(dataSource));
        }

        Mockito.verify(node, Mockito.never()).setNodeFilter(Mockito.any(), Mockito.any(), Mockito.anyBoolean());
        Mockito.verify(dataSource, Mockito.never()).persistConfiguration();
    }

    @Test
    void connectionFilterIsPersistedAfterPermissionCheck() throws Exception {
        WebSession session = Mockito.mock(WebSession.class);
        DBNModel navigatorModel = Mockito.mock(DBNModel.class);
        DBNDatabaseNode node = Mockito.mock(DBNDatabaseNode.class);
        BaseWebProjectImpl project = Mockito.mock(BaseWebProjectImpl.class);
        RMProject rmProject = Mockito.mock(RMProject.class);
        DBPDataSourceContainer dataSource = Mockito.mock(DBPDataSourceContainer.class);
        DBXTreeItem itemsMeta = Mockito.mock(DBXTreeItem.class);

        Mockito.when(session.getNavigatorModelOrThrow()).thenReturn(navigatorModel);
        Mockito.when(navigatorModel.getNodeByPath(session.getProgressMonitor(), "node")).thenReturn(node);
        Mockito.when(node.getOwnerProject()).thenReturn(project);
        Mockito.when(node.getDataSourceContainer()).thenReturn(dataSource);
        Mockito.when(project.getRMProject()).thenReturn(rmProject);

        try (MockedStatic<SMUtils> smUtils = Mockito.mockStatic(SMUtils.class);
             MockedStatic<DBNUtils> dbnUtils = Mockito.mockStatic(DBNUtils.class)) {
            smUtils.when(() -> SMUtils.hasProjectPermission(
                session,
                rmProject,
                RMProjectPermission.DATA_SOURCES_EDIT
            )).thenReturn(true);
            dbnUtils.when(() -> DBNUtils.getValidItemsMeta(session.getProgressMonitor(), node)).thenReturn(itemsMeta);
            Mockito.when(node.setNodeFilter(Mockito.eq(itemsMeta), Mockito.any(), Mockito.eq(false))).thenReturn(true);

            Assertions.assertTrue(new WebServiceNavigator().setNavigatorNodeFilter(
                session,
                "node",
                List.of("prod_%"),
                List.of("prod_internal%")
            ));
        }

        ArgumentCaptor<DBSObjectFilter> filterCaptor = ArgumentCaptor.forClass(DBSObjectFilter.class);
        Mockito.verify(node).setNodeFilter(Mockito.eq(itemsMeta), filterCaptor.capture(), Mockito.eq(false));
        Assertions.assertEquals(List.of("prod_%"), filterCaptor.getValue().getInclude());
        Assertions.assertEquals(List.of("prod_internal%"), filterCaptor.getValue().getExclude());
        Assertions.assertFalse(filterCaptor.getValue().isUserFilter());
        Mockito.verify(dataSource).persistConfiguration();
    }

    @Test
    void anonymousUserStoresLegacyFilterInSession() throws Exception {
        WebSession session = Mockito.mock(WebSession.class);
        WebUserContext userContext = Mockito.mock(WebUserContext.class);
        DBNModel navigatorModel = Mockito.mock(DBNModel.class);
        DBNDatabaseNode node = Mockito.mock(DBNDatabaseNode.class);
        BaseWebProjectImpl project = Mockito.mock(BaseWebProjectImpl.class);
        RMProject rmProject = Mockito.mock(RMProject.class);
        DBPDataSourceContainer dataSource = Mockito.mock(DBPDataSourceContainer.class);
        DBXTreeItem itemsMeta = Mockito.mock(DBXTreeItem.class);

        Mockito.when(session.getUserContext()).thenReturn(userContext);
        Mockito.when(userContext.isNonAnonymousUserAuthorizedInSM()).thenReturn(false);
        Mockito.when(session.getNavigatorModelOrThrow()).thenReturn(navigatorModel);
        Mockito.when(navigatorModel.getNodeByPath(session.getProgressMonitor(), "node")).thenReturn(node);
        Mockito.when(node.getOwnerProject()).thenReturn(project);
        Mockito.when(node.getDataSourceContainer()).thenReturn(dataSource);
        Mockito.when(project.getRMProject()).thenReturn(rmProject);

        try (MockedStatic<SMUtils> smUtils = Mockito.mockStatic(SMUtils.class);
             MockedStatic<DBNUtils> dbnUtils = Mockito.mockStatic(DBNUtils.class);
             MockedStatic<UserDBSObjectFilterUtils> filterUtils = Mockito.mockStatic(UserDBSObjectFilterUtils.class)) {
            smUtils.when(() -> SMUtils.hasProjectPermission(
                session,
                rmProject,
                RMProjectPermission.DATA_SOURCES_EDIT
            )).thenReturn(false);
            dbnUtils.when(() -> DBNUtils.getValidItemsMeta(session.getProgressMonitor(), node)).thenReturn(itemsMeta);
            Mockito.when(node.setNodeFilter(Mockito.eq(itemsMeta), Mockito.any(), Mockito.eq(false))).thenReturn(true);

            Assertions.assertTrue(new WebServiceNavigator().setNavigatorNodeFilter(
                session,
                "node",
                List.of("prod_%"),
                List.of("prod_internal%")
            ));

            ArgumentCaptor<DBSObjectFilter> filterCaptor = ArgumentCaptor.forClass(DBSObjectFilter.class);
            Mockito.verify(node).setNodeFilter(Mockito.eq(itemsMeta), filterCaptor.capture(), Mockito.eq(false));
            Assertions.assertEquals(List.of("prod_%"), filterCaptor.getValue().getInclude());
            Assertions.assertEquals(List.of("prod_internal%"), filterCaptor.getValue().getExclude());
            Assertions.assertFalse(filterCaptor.getValue().isUserFilter());
            filterUtils.verify(
                () -> UserDBSObjectFilterUtils.updateUserObjectFilters(dataSource),
                Mockito.never()
            );
        }

        Mockito.verify(node, Mockito.never()).setUserNodeFilter(Mockito.any(), Mockito.any());
        Mockito.verify(dataSource, Mockito.never()).persistConfiguration();
    }

    @Test
    void anonymousUserCannotChangeUserFilter() {
        WebSession session = Mockito.mock(WebSession.class);
        WebUserContext userContext = Mockito.mock(WebUserContext.class);
        Mockito.when(session.getUserContext()).thenReturn(userContext);
        Mockito.when(userContext.isNonAnonymousUserAuthorizedInSM()).thenReturn(false);

        Assertions.assertThrows(
            DBWebExceptionAccessDenied.class,
            () -> new WebServiceNavigator().setUserNavigatorNodeFilter(session, "node", List.of("prod_%"), null)
        );
    }

    @Test
    void authenticatedUserCanChangeUserFilterWithoutDataSourceEditPermission() throws Exception {
        WebSession session = Mockito.mock(WebSession.class);
        WebUserContext userContext = Mockito.mock(WebUserContext.class);
        DBNModel navigatorModel = Mockito.mock(DBNModel.class);
        DBNDatabaseNode node = Mockito.mock(DBNDatabaseNode.class);
        DBPDataSourceContainer dataSource = Mockito.mock(DBPDataSourceContainer.class);
        DBXTreeItem itemsMeta = Mockito.mock(DBXTreeItem.class);

        Mockito.when(session.getUserContext()).thenReturn(userContext);
        Mockito.when(userContext.isNonAnonymousUserAuthorizedInSM()).thenReturn(true);
        Mockito.when(session.getNavigatorModelOrThrow()).thenReturn(navigatorModel);
        Mockito.when(navigatorModel.getNodeByPath(session.getProgressMonitor(), "node")).thenReturn(node);
        Mockito.when(node.getDataSourceContainer()).thenReturn(dataSource);

        try (MockedStatic<DBNUtils> dbnUtils = Mockito.mockStatic(DBNUtils.class);
             MockedStatic<UserDBSObjectFilterUtils> filterUtils = Mockito.mockStatic(UserDBSObjectFilterUtils.class)) {
            dbnUtils.when(() -> DBNUtils.getValidItemsMeta(session.getProgressMonitor(), node)).thenReturn(itemsMeta);
            Mockito.when(node.setUserNodeFilter(Mockito.eq(itemsMeta), Mockito.any())).thenReturn(true);

            Assertions.assertTrue(new WebServiceNavigator().setUserNavigatorNodeFilter(
                session,
                "node",
                List.of("prod_%"),
                List.of("prod_internal%")
            ));

            ArgumentCaptor<DBSObjectFilter> filterCaptor = ArgumentCaptor.forClass(DBSObjectFilter.class);
            Mockito.verify(node).setUserNodeFilter(Mockito.eq(itemsMeta), filterCaptor.capture());
            Assertions.assertEquals(List.of("prod_%"), filterCaptor.getValue().getInclude());
            Assertions.assertEquals(List.of("prod_internal%"), filterCaptor.getValue().getExclude());
            Assertions.assertTrue(filterCaptor.getValue().isUserFilter());
            filterUtils.verify(() -> UserDBSObjectFilterUtils.updateUserObjectFilters(dataSource));
        }
    }

    @Test
    void resetUserFiltersClearsConnectionSettings() throws Exception {
        WebSession session = Mockito.mock(WebSession.class);
        WebUserContext userContext = Mockito.mock(WebUserContext.class);
        WebConnectionInfo connectionInfo = Mockito.mock(WebConnectionInfo.class);
        DBPDataSourceContainer dataSource = Mockito.mock(DBPDataSourceContainer.class);

        Mockito.when(session.getUserContext()).thenReturn(userContext);
        Mockito.when(userContext.isNonAnonymousUserAuthorizedInSM()).thenReturn(true);
        Mockito.when(connectionInfo.getDataSourceContainer()).thenReturn(dataSource);

        try (MockedStatic<UserDBSObjectFilterUtils> filterUtils = Mockito.mockStatic(UserDBSObjectFilterUtils.class)) {
            Assertions.assertTrue(new WebServiceNavigator().resetUserNavigatorFilters(session, connectionInfo));
            filterUtils.verify(() -> UserDBSObjectFilterUtils.clearUserObjectFilters(dataSource));
        }
    }
}

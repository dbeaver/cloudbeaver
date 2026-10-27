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
package io.cloudbeaver.model.navigator;

import io.cloudbeaver.BaseWebProjectImpl;
import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.navigator.WebNavigatorNodeInfo;
import io.cloudbeaver.service.security.SMUtils;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.DBNUtils;
import org.jkiss.dbeaver.model.navigator.meta.DBXTreeItem;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.DBSObjectFilter;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

public class WebNavigatorNodeInfoTest extends CloudbeaverMockTest {

    @Test
    public void testBasicPropertiesAndToString() {
        WebSession session = Mockito.mock(WebSession.class);
        Mockito.when(session.getLocale()).thenReturn("en");

        DBNNode node = Mockito.mock(DBNNode.class);
        Mockito.when(node.getParentNode()).thenReturn(null);
        Mockito.when(node.getNodeId()).thenReturn("uri");
        Mockito.when(node.getLocalizedName("en")).thenReturn("NodeName");
        Mockito.when(node.getNodeDescription()).thenReturn("A description");
        Mockito.when(node.getNodeType()).thenReturn("nodeType");
        Mockito.when(node.hasChildren(true)).thenReturn(true);

        WebNavigatorNodeInfo info = new WebNavigatorNodeInfo(session, node);

        Assertions.assertEquals("node://uri", info.getUri());
        Assertions.assertEquals("NodeName", info.getName());
        Assertions.assertEquals("A description", info.getDescription());
        Assertions.assertEquals("nodeType", info.getNodeType());
        Assertions.assertTrue(info.isHasChildren());
        Assertions.assertEquals("node://uri", info.toString());
    }

    @Test
    public void testGetObjectReturnsForDatabaseNode() {
        WebSession session = Mockito.mock(WebSession.class);
        Mockito.when(session.getLocale()).thenReturn("en");

        DBNDatabaseNode dbNode = Mockito.mock(DBNDatabaseNode.class);
        DBSObject dbsObject = Mockito.mock(DBSObject.class);
        Mockito.when(dbNode.getObject()).thenReturn(dbsObject);
        Mockito.when(dbNode.getLocalizedName("en")).thenReturn("DBNodeName");
        Mockito.when(dbNode.getLocalizedName("es")).thenReturn("DBNodeName1");

        WebNavigatorNodeInfo info = new WebNavigatorNodeInfo(session, dbNode);

        Assertions.assertNotNull(info.getObject());
        Assertions.assertEquals("DBNodeName", info.getName());

        Mockito.when(session.getLocale()).thenReturn("es");
        Assertions.assertEquals("DBNodeName1", info.getName());


    }

    @Test
    public void testConnectionAndUserFiltersAreExposedSeparately() throws Exception {
        WebSession session = Mockito.mock(WebSession.class);
        DBNDatabaseNode dbNode = Mockito.mock(DBNDatabaseNode.class);
        DBXTreeItem itemsMeta = Mockito.mock(DBXTreeItem.class);
        DBSObjectFilter connectionFilter = new DBSObjectFilter();
        connectionFilter.addInclude("prod_%");
        DBSObjectFilter userFilter = new DBSObjectFilter();
        userFilter.addInclude("prod_eu_%");
        userFilter.setUserFilter(true);

        try (MockedStatic<DBNUtils> dbnUtils = Mockito.mockStatic(DBNUtils.class)) {
            dbnUtils.when(() -> DBNUtils.getValidItemsMeta(session.getProgressMonitor(), dbNode)).thenReturn(itemsMeta);
            Mockito.when(dbNode.getNodeFilter(itemsMeta, true)).thenReturn(connectionFilter);
            Mockito.when(dbNode.getUserNodeFilter(itemsMeta, true)).thenReturn(userFilter);

            WebNavigatorNodeInfo info = new WebNavigatorNodeInfo(session, dbNode);

            Assertions.assertSame(userFilter, info.getFilter());
            Assertions.assertSame(connectionFilter, info.getConnectionFilter());
            Assertions.assertSame(userFilter, info.getUserFilter());
            Assertions.assertTrue(info.isUserFiltered());
        }
    }

    @Test
    public void testUserFilterIsNullForNonDatabaseNode() throws Exception {
        WebSession session = Mockito.mock(WebSession.class);
        DBNNode node = Mockito.mock(DBNNode.class);

        Assertions.assertNull(new WebNavigatorNodeInfo(session, node).getUserFilter());
    }

    @Test
    public void testLegacyFilterMatchesConnectionMutationForDataSourceEditors() throws Exception {
        WebSession session = Mockito.mock(WebSession.class);
        DBNDatabaseNode dbNode = Mockito.mock(DBNDatabaseNode.class);
        DBXTreeItem itemsMeta = Mockito.mock(DBXTreeItem.class);
        BaseWebProjectImpl project = Mockito.mock(BaseWebProjectImpl.class);
        RMProject rmProject = Mockito.mock(RMProject.class);
        DBSObjectFilter connectionFilter = new DBSObjectFilter();
        connectionFilter.addInclude("prod_%");
        DBSObjectFilter userFilter = new DBSObjectFilter();
        userFilter.addInclude("prod_eu_%");

        Mockito.when(dbNode.getOwnerProject()).thenReturn(project);
        Mockito.when(project.getRMProject()).thenReturn(rmProject);

        try (MockedStatic<DBNUtils> dbnUtils = Mockito.mockStatic(DBNUtils.class);
             MockedStatic<SMUtils> smUtils = Mockito.mockStatic(SMUtils.class)) {
            dbnUtils.when(() -> DBNUtils.getValidItemsMeta(session.getProgressMonitor(), dbNode)).thenReturn(itemsMeta);
            smUtils.when(() -> SMUtils.hasProjectPermission(
                session,
                rmProject,
                RMProjectPermission.DATA_SOURCES_EDIT
            )).thenReturn(true);
            Mockito.when(dbNode.getNodeFilter(itemsMeta, true)).thenReturn(connectionFilter);
            Mockito.when(dbNode.getUserNodeFilter(itemsMeta, true)).thenReturn(userFilter);

            Assertions.assertSame(connectionFilter, new WebNavigatorNodeInfo(session, dbNode).getFilter());
        }
    }

    @Test
    public void testLegacyFilterFallsBackToConnectionForDisabledUserFilter() throws Exception {
        WebSession session = Mockito.mock(WebSession.class);
        DBNDatabaseNode dbNode = Mockito.mock(DBNDatabaseNode.class);
        DBXTreeItem itemsMeta = Mockito.mock(DBXTreeItem.class);
        DBSObjectFilter connectionFilter = new DBSObjectFilter();
        connectionFilter.addInclude("prod_%");
        DBSObjectFilter userFilter = new DBSObjectFilter();
        userFilter.addInclude("prod_eu_%");
        userFilter.setEnabled(false);

        try (MockedStatic<DBNUtils> dbnUtils = Mockito.mockStatic(DBNUtils.class)) {
            dbnUtils.when(() -> DBNUtils.getValidItemsMeta(session.getProgressMonitor(), dbNode)).thenReturn(itemsMeta);
            Mockito.when(dbNode.getNodeFilter(itemsMeta, true)).thenReturn(connectionFilter);
            Mockito.when(dbNode.getUserNodeFilter(itemsMeta, true)).thenReturn(userFilter);

            Assertions.assertSame(connectionFilter, new WebNavigatorNodeInfo(session, dbNode).getFilter());
        }
    }
}

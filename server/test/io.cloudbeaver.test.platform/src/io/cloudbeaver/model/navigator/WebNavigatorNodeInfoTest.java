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
package io.cloudbeaver.model.navigator;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.navigator.WebNavigatorNodeInfo;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;

public class WebNavigatorNodeInfoTest extends CloudbeaverMockTest {

    @Test
    public void testBasicPropertiesAndToString() {
        WebSession session = Mockito.mock(WebSession.class);
        Mockito.when(session.getLocale()).thenReturn("en");

        DBNNode node = Mockito.mock(DBNNode.class);
        Mockito.when(node.getParentNode()).thenReturn(null);
        Mockito.when(node.getNodeId()).thenReturn("uri");
        Mockito.when(node.getNodeItemPath()).thenReturn("node/path");
        Mockito.when(node.getLocalizedName("en")).thenReturn("NodeName");
        Mockito.when(node.getNodeDescription()).thenReturn("A description");
        Mockito.when(node.getNodeType()).thenReturn("nodeType");
        Mockito.when(node.hasChildren(true)).thenReturn(true);

        WebNavigatorNodeInfo info = new WebNavigatorNodeInfo(session, node);

        Assert.assertEquals("node/path", info.getId());
        Assert.assertEquals("node://uri", info.getUri());
        Assert.assertEquals("NodeName", info.getName());
        Assert.assertEquals("A description", info.getDescription());
        Assert.assertEquals("nodeType", info.getNodeType());
        Assert.assertTrue(info.isHasChildren());
        Assert.assertEquals("node://uri", info.toString());
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

        Assert.assertNotNull(info.getObject());
        Assert.assertEquals("DBNodeName", info.getName());

        Mockito.when(session.getLocale()).thenReturn("es");
        Assert.assertEquals("DBNodeName1", info.getName());


    }
}
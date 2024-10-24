/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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

import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.*;
import org.jkiss.dbeaver.model.connection.DBPDataSourceProviderDescriptor;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.navigator.*;
import org.jkiss.dbeaver.model.navigator.meta.DBXTreeDescriptor;
import org.jkiss.dbeaver.model.navigator.meta.DBXTreeItem;
import org.jkiss.dbeaver.model.preferences.DBPPreferenceStore;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.registry.BaseProjectImpl;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceRegistry;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class NavigatorModelTest {

    private static DBPPlatform platform;
    private static DBPWorkspace workspace;

    @BeforeClass
    public static void setUp() {
        DBPApplication app = Mockito.mock(CBApplication.class);
        Mockito.when(app.isMultiuser()).thenReturn(true);
        platform = Mockito.mock(CBPlatform.class);
        Mockito.when(platform.getApplication()).thenReturn(app);

        workspace = Mockito.mock(DBPWorkspace.class);
        Mockito.when(workspace.getPlatform()).thenReturn(platform);
        DBPPreferenceStore preferenceStore = Mockito.mock(DBPPreferenceStore.class);
        Mockito.when(platform.getPreferenceStore()).thenReturn(preferenceStore);
    }

    @Test
    public void testModel() throws Exception {
        List<DBPDataSourceContainer> dataSources = new ArrayList<>();
        int dataSourcesSize = new Random().nextInt(10) + 1;
        for (int i = 0; i < dataSourcesSize; i++) {
            dataSources.add(createMockDataSource(i));
        }

        DBPProject project1 = Mockito.mock(BaseProjectImpl.class);
        String project1Name = "project1";

        DBPDataSourceRegistry registry1 = Mockito.mock(DataSourceRegistry.class);
        Mockito.when(project1.getDataSourceRegistry()).thenReturn(registry1);
        Mockito.doReturn(dataSources).when(registry1).getDataSources();

        Mockito.when(project1.getName()).thenReturn(project1Name);
        Mockito.when(project1.getDisplayName()).thenCallRealMethod();
        Mockito.when(project1.getWorkspace()).thenReturn(workspace);

        DBPProject project2 = Mockito.mock(BaseProjectImpl.class);
        String project2Name = "project2";
        Mockito.when(project2.getName()).thenReturn(project2Name);
        Mockito.when(project2.getWorkspace()).thenReturn(workspace);
        Mockito.when(project2.getDisplayName()).thenCallRealMethod();

        var model = new DBNModel(platform, List.of(project1, project2));
        model.initialize();

        DBNRoot root = model.getRoot();
        Assert.assertEquals(2, root.getProjects().length);
        Assert.assertEquals(project1, root.getProjects()[0].getProject());
        Assert.assertEquals(project2, root.getProjects()[1].getProject());

        Assert.assertEquals(model, root.getModel());

        VoidProgressMonitor monitor = new VoidProgressMonitor();
        DBNNode[] children = root.getChildren(monitor);
        Assert.assertEquals(2, children.length);
        Assert.assertEquals(project1Name, children[0].getNodeDisplayName());
        Assert.assertEquals(project2Name, children[1].getNodeDisplayName());

        DBNNode[] result = children[0].getChildren(monitor);

        Assert.assertEquals(1, result.length);
        Assert.assertTrue(result[0] instanceof DBNProjectDatabases);

        DBNNode[] databases = result[0].getChildren(monitor);
        Assert.assertEquals(dataSourcesSize, databases.length);
        for (DBNNode database : databases) {
            Assert.assertTrue(database instanceof DBNDataSource);
        }
    }

    private DBPDataSourceContainer createMockDataSource(int id) {
        DataSourceDescriptor dataSourceContainer = Mockito.mock(DataSourceDescriptor.class);
        Mockito.when(dataSourceContainer.getName()).thenReturn("testDataSource" + id);
        DBPDriver driver = Mockito.mock(DBPDriver.class);
        DBPDataSourceProviderDescriptor provider1 = Mockito.mock(DBPDataSourceProviderDescriptor.class);

        DBXTreeItem treeItem1 = Mockito.mock(DBXTreeItem.class);
        Mockito.when(driver.getNavigatorRoot()).thenReturn(treeItem1);
        DBXTreeDescriptor tree1 = Mockito.mock(DBXTreeDescriptor.class);
        Mockito.when(provider1.getTreeDescriptor()).thenReturn(tree1);
        Mockito.when(dataSourceContainer.getDriver()).thenReturn(driver);
        return dataSourceContainer;
    }

}

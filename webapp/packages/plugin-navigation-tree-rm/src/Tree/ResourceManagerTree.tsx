/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { getComputed, s, useResource, useS, useUserData } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource, NavTreeResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import { getRmResourcePath, ResourceManagerResource, RESOURCES_NODE_PATH } from '@cloudbeaver/core-resource-manager';
import { isArraysEqual } from '@cloudbeaver/core-utils';
import { CaptureView } from '@cloudbeaver/core-view';
import {
  createElementsTreeSettings,
  ElementsTreeLoader,
  getNavigationTreeUserSettingsId,
  type IElementsTreeSettings,
  NavigationTreeService,
  validateElementsTreeSettings,
} from '@cloudbeaver/plugin-navigation-tree';
import { ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';
import { UserInfoResource } from '@cloudbeaver/core-authentication';

import { navigationTreeProjectFilter } from './ProjectsRenderer/navigationTreeProjectFilter.js';
import { navigationTreeProjectSearchCompare } from './ProjectsRenderer/navigationTreeProjectSearchCompare.js';
import { navigationTreeProjectsExpandStateGetter } from './ProjectsRenderer/navigationTreeProjectsExpandStateGetter.js';
import { navigationTreeProjectsRendererRenderer } from './ProjectsRenderer/navigationTreeProjectsRendererRenderer.js';
import { navigationTreeResourceTypeFilter } from './ProjectsRenderer/navigationTreeResourceTypeFilter.js';
import { ProjectsSettingsPlaceholderElement } from './ProjectsRenderer/ProjectsSettingsForm.js';
import { navigationTreeResourceExpandStateGetter } from './ResourceFolderRenderer/navigationTreeResourceExpandStateGetter.js';
import style from './ResourceManagerTree.module.css';
import { ResourceManagerTreeCaptureViewContext } from './ResourceManagerTreeCaptureViewContext.js';
import { transformResourceNodeInfo } from './ResourceRenderer/transformResourceNodeInfo.js';

interface Props extends React.PropsWithChildren {
  resourceTypeId?: string;
}

export const ResourceManagerTree: React.FC<Props> = observer(function ResourceManagerTree({ resourceTypeId, children }) {
  const styles = useS(style);
  const root = RESOURCES_NODE_PATH;

  const projectsNavNodeService = useService(ProjectsNavNodeService);
  const projectsService = useService(ProjectsService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const projectInfoResource = useService(ProjectInfoResource);
  const navTreeService = useService(NavigationTreeService);
  const resourceManagerService = useService(ResourceManagerService);
  const navTreeResource = useService(NavTreeResource);
  const userInfoResource = useService(UserInfoResource);

  const key = getComputed<string[]>(() => projectsService.activeProjects.map(project => getRmResourcePath(project.id)), isArraysEqual);
  useResource(ResourceManagerTree, ResourceManagerResource, resourceKeyList(key));

  const settings = useUserData<IElementsTreeSettings>(
    getNavigationTreeUserSettingsId(root),
    createElementsTreeSettings,
    () => {},
    validateElementsTreeSettings,
  );

  const projectsRendererRenderer = useMemo(
    () => navigationTreeProjectsRendererRenderer(navNodeInfoResource, resourceManagerService, projectsNavNodeService, resourceTypeId),
    [navNodeInfoResource, resourceManagerService, projectsNavNodeService, resourceTypeId],
  );

  const resourceExpandStateGetter = useMemo(
    () => navigationTreeResourceExpandStateGetter(navNodeInfoResource, resourceManagerService, projectsNavNodeService, resourceTypeId),
    [navNodeInfoResource, resourceManagerService, projectsNavNodeService, resourceTypeId],
  );

  const projectsExpandStateGetter = useMemo(
    () => navigationTreeProjectsExpandStateGetter(navNodeInfoResource, projectsService, projectsNavNodeService),
    [navNodeInfoResource, projectsService, projectsNavNodeService],
  );
  const transformResourceNode = useMemo(
    () => transformResourceNodeInfo(projectInfoResource, projectsNavNodeService, navNodeInfoResource, resourceTypeId),
    [projectInfoResource, projectsNavNodeService, navNodeInfoResource, resourceTypeId],
  );
  const projectFilter = useMemo(
    () =>
      navigationTreeProjectFilter(
        projectsNavNodeService,
        projectsService,
        navNodeInfoResource,
        navTreeResource,
        resourceManagerService,
        resourceTypeId,
      ),
    [projectsNavNodeService, projectsService, navNodeInfoResource, navTreeResource, resourceManagerService, resourceTypeId],
  );
  const resourceTypeFilter = useMemo(
    () => navigationTreeResourceTypeFilter(navNodeInfoResource, projectsNavNodeService, projectInfoResource, resourceTypeId),
    [navNodeInfoResource, projectsNavNodeService, projectInfoResource, resourceTypeId],
  );

  const settingsElements = useMemo(() => [ProjectsSettingsPlaceholderElement], []);

  async function loadChildren(nodeId: string, manual: boolean) {
    await userInfoResource.load();
    if (!resourceManagerService.enabled) {
      return false;
    }

    return navTreeService.loadNestedNodes(nodeId, manual);
  }

  return (
    <CaptureView view={navTreeService} className={s(styles, { captureView: true })}>
      <ResourceManagerTreeCaptureViewContext resourceTypeId={resourceTypeId} />
      <ElementsTreeLoader
        root={root}
        getChildren={navTreeService.getChildren}
        loadChildren={loadChildren}
        settings={settings}
        nodeInfoTransformers={[transformResourceNode]}
        filters={[resourceTypeFilter, projectFilter]}
        renderers={[projectsRendererRenderer]}
        expandStateGetters={[projectsExpandStateGetter, resourceExpandStateGetter]}
        navNodeFilterCompare={navigationTreeProjectSearchCompare}
        settingsElements={settingsElements}
        className={s(styles, { elementsTreeLoader: true })}
        emptyPlaceholder={() => (
          <div className={s(styles, { center: true })}>
            <div className={s(styles, { message: true })}>{children}</div>
          </div>
        )}
        onOpen={node => navTreeService.navToNode(node.id, node.parentId)}
      />
    </CaptureView>
  );
});

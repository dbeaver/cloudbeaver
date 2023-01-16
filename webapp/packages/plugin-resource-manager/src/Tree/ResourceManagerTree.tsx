/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { useUserData } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfo, ProjectsService } from '@cloudbeaver/core-projects';
import { NAV_NODE_TYPE_RM_PROJECT, RESOURCES_NODE_PATH } from '@cloudbeaver/core-resource-manager';
import { createPath } from '@cloudbeaver/core-utils';
import { CaptureView } from '@cloudbeaver/core-view';
import { NavigationTreeService, ElementsTree, IElementsTreeSettings, createElementsTreeSettings, validateElementsTreeSettings, getNavigationTreeUserSettingsId } from '@cloudbeaver/plugin-navigation-tree';

import { ResourcesProjectsNavNodeService } from '../NavNodes/ResourcesProjectsNavNodeService';
import { ResourceManagerService } from '../ResourceManagerService';
import { navigationTreeProjectFilter } from './ProjectsRenderer/navigationTreeProjectFilter';
import { navigationTreeProjectSearchCompare } from './ProjectsRenderer/navigationTreeProjectSearchCompare';
import { navigationTreeProjectsExpandStateGetter } from './ProjectsRenderer/navigationTreeProjectsExpandStateGetter';
import { navigationTreeProjectsRendererRenderer } from './ProjectsRenderer/navigationTreeProjectsRendererRenderer';
import { ProjectsSettingsPlaceholderElement } from './ProjectsRenderer/ProjectsSettingsForm';
import { ResourceManagerTreeCaptureViewContext } from './ResourceManagerTreeCaptureViewContext';

const styles = css`
  CaptureView {
    outline: none;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: auto;
  }
  ElementsTree {
    min-width: 100%;
    width: max-content;
  }
  Loader {
    display: flex;
    height: 100%;
    width: 100%;
    min-width: 240px;
  }
  center {
    height: 100%;
    width: 100%;
    display: flex;
  }
  message {
    padding: 24px;
    box-sizing: border-box;
    max-width: 240px;
    text-align: center;
    margin: auto;
  }
`;

interface Props extends React.PropsWithChildren {
  resourceTypeId?: string;
}

export const ResourceManagerTree: React.FC<Props> = observer(function ResourceManagerTree({
  resourceTypeId,
  children,
}) {
  const root = RESOURCES_NODE_PATH;

  const resourcesProjectsNavNodeService = useService(ResourcesProjectsNavNodeService);
  const projectsService = useService(ProjectsService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeResource = useService(NavTreeResource);
  const navTreeService = useService(NavigationTreeService);
  const resourceManagerService = useService(ResourceManagerService);

  const settings = useUserData<IElementsTreeSettings>(
    getNavigationTreeUserSettingsId(root),
    createElementsTreeSettings,
    () => { },
    validateElementsTreeSettings
  );

  const projectsRendererRenderer = useMemo(
    () => navigationTreeProjectsRendererRenderer(navNodeInfoResource),
    [navNodeInfoResource]
  );
  const projectsExpandStateGetter = useMemo(
    () => navigationTreeProjectsExpandStateGetter(
      navNodeInfoResource,
      projectsService,
      resourcesProjectsNavNodeService
    ),
    [
      navNodeInfoResource,
      projectsService,
      resourcesProjectsNavNodeService,
    ]
  );
  const projectFilter = useMemo(
    () => navigationTreeProjectFilter(
      resourcesProjectsNavNodeService,
      projectsService,
      navNodeInfoResource,
      navTreeResource
    ),
    [
      resourcesProjectsNavNodeService,
      projectsService,
      navNodeInfoResource,
      navTreeResource,
    ]
  );

  const settingsElements = useMemo(() => ([ProjectsSettingsPlaceholderElement]), []);

  function getResourceTypeFolder(project: ProjectInfo): string {
    if (!resourceTypeId) {
      return createPath(RESOURCES_NODE_PATH, project.id);
    }

    const resourceFolder = resourceManagerService.getRootFolder(project, resourceTypeId);
    return createPath(RESOURCES_NODE_PATH, project.id, resourceFolder);
  }

  function getChildren(id: string) {
    const node = navNodeInfoResource.get(id);

    if (node?.nodeType === NAV_NODE_TYPE_RM_PROJECT) {
      const project = resourcesProjectsNavNodeService.getProject(node.id);

      if (project) {
        id = getResourceTypeFolder(project);
      }
    }

    return navTreeService.getChildren(id);
  }

  async function loadNestedNodes(id = root, tryConnect?: boolean, notify = true) {
    const node = navNodeInfoResource.get(id);

    let isNodesLoaded = await navTreeService.loadNestedNodes(id, tryConnect, notify);

    if (node?.nodeType === NAV_NODE_TYPE_RM_PROJECT && isNodesLoaded) {
      const project = resourcesProjectsNavNodeService.getProject(node.id);

      if (project) {
        const scriptsRoot = getResourceTypeFolder(project);

        if (scriptsRoot !== id && navNodeInfoResource.has(scriptsRoot)) {
          isNodesLoaded = await navTreeService.loadNestedNodes(scriptsRoot, tryConnect, notify);
        }
      }
    }

    return isNodesLoaded;
  }

  return styled(styles)(
    <CaptureView view={navTreeService}>
      <ResourceManagerTreeCaptureViewContext resourceTypeId={resourceTypeId} />
      <ElementsTree
        root={root}
        getChildren={getChildren}
        loadChildren={loadNestedNodes}
        // getChildren={navTreeService.getChildren}
        // loadChildren={navTreeService.loadNestedNodes}
        settings={settings}
        filters={[projectFilter]}
        renderers={[projectsRendererRenderer]}
        expandStateGetters={[projectsExpandStateGetter]}
        navNodeFilterCompare={navigationTreeProjectSearchCompare}
        settingsElements={settingsElements}
        emptyPlaceholder={() => styled(styles)(
          <center>
            <message>
              {children}
            </message>
          </center>
        )}
        onOpen={node => navTreeService.navToNode(node.id, node.parentId)}
      />
    </CaptureView>
  );
});
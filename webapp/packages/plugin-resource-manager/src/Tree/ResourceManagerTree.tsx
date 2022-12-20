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

import { Loader, useDataResource, useTranslate, useUserData } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { CaptureView } from '@cloudbeaver/core-view';
import { NavigationTreeService, ElementsTree, IElementsTreeSettings, createElementsTreeSettings, validateElementsTreeSettings, getNavigationTreeUserSettingsId } from '@cloudbeaver/plugin-navigation-tree';

import { ResourcesProjectsNavNodeService } from '../NavNodes/ResourcesProjectsNavNodeService';
import { ResourceProjectsResource } from '../ResourceProjectsResource';
import { RESOURCES_NODE_PATH } from '../RESOURCES_NODE_PATH';
import { navigationTreeProjectFilter } from './ProjectsRenderer/navigationTreeProjectFilter';
import { navigationTreeProjectSearchCompare } from './ProjectsRenderer/navigationTreeProjectSearchCompare';
import { navigationTreeProjectsExpandStateGetter } from './ProjectsRenderer/navigationTreeProjectsExpandStateGetter';
import { navigationTreeProjectsRendererRenderer } from './ProjectsRenderer/navigationTreeProjectsRendererRenderer';
import { ProjectsSettingsPlaceholderElement } from './ProjectsRenderer/ProjectsSettingsForm';

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


export const ResourceManagerTree = observer(function ResourceManagerTree() {
  const root = RESOURCES_NODE_PATH;

  const translate = useTranslate();

  const resourcesProjectsNavNodeService = useService(ResourcesProjectsNavNodeService);
  const projectsService = useService(ProjectsService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeResource = useService(NavTreeResource);
  const navTreeService = useService(NavigationTreeService);

  const settings = useUserData<IElementsTreeSettings>(
    getNavigationTreeUserSettingsId(root),
    createElementsTreeSettings,
    () => { },
    validateElementsTreeSettings
  );

  const resourceProjectsLoader = useDataResource(ResourceManagerTree, ResourceProjectsResource, undefined);

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

  return styled(styles)(
    <Loader state={resourceProjectsLoader}>
      <CaptureView view={navTreeService}>
        <ElementsTree
          root={root}
          getChildren={navTreeService.getChildren}
          loadChildren={navTreeService.loadNestedNodes}
          settings={settings}
          filters={[projectFilter]}
          renderers={[projectsRendererRenderer]}
          expandStateGetters={[projectsExpandStateGetter]}
          navNodeFilterCompare={navigationTreeProjectSearchCompare}
          settingsElements={settingsElements}
          emptyPlaceholder={() => styled(styles)(
            <center>
              <message>
                {translate('plugin_resource_manager_no_resources_placeholder')}
              </message>
            </center>
          )}
          onOpen={node => navTreeService.navToNode(node.id, node.parentId)}
        />
      </CaptureView>
    </Loader>
  );
});
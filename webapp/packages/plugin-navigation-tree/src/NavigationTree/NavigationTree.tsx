/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo, useRef } from 'react';

import { s, SContext, type StyleRegistry, Translate, useExecutor, useS, useUserData } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource, NavTreeResource, ProjectsNavNodeService, ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { CaptureView } from '@cloudbeaver/core-view';

import { ElementsTreeToolsStyles } from '../index.js';
import { NavNodeViewService } from '../NodesManager/NavNodeView/NavNodeViewService.js';
import { navigationTreeConnectionGroupFilter } from './ConnectionGroup/navigationTreeConnectionGroupFilter.js';
import { navigationTreeConnectionGroupRenderer } from './ConnectionGroup/navigationTreeConnectionGroupRenderer.js';
import { navTreeConnectionRenderer } from './ConnectionsRenderer/navTreeConnectionRenderer.js';
import { ElementsTree } from './ElementsTree/ElementsTree.js';
import {
  createElementsTreeSettings,
  validateElementsTreeSettings,
} from './ElementsTree/ElementsTreeTools/NavigationTreeSettings/createElementsTreeSettings.js';
import { ObjectsDescriptionSettingsPlaceholderElement } from './ElementsTree/ElementsTreeTools/NavigationTreeSettings/ObjectsDescriptionSettingsForm.js';
import { transformDescriptionNodeInfo } from './ElementsTree/transformDescriptionNodeInfo.js';
import { transformFilteredNodeInfo } from './ElementsTree/transformFilteredNodeInfo.js';
import type { IElementsTree, IElementsTreeSettings } from './ElementsTree/useElementsTree.js';
import elementsTreeToolsStyles from './ElementsTreeTools.module.css';
import { getNavigationTreeUserSettingsId } from './getNavigationTreeUserSettingsId.js';
import style from './NavigationTree.module.css';
import { navigationTreeDuplicateFilter } from './navigationTreeDuplicateIdFilter.js';
import { NavigationTreeService } from './NavigationTreeService.js';
import { navigationTreeProjectFilter } from './ProjectsRenderer/navigationTreeProjectFilter.js';
import { navigationTreeProjectSearchCompare } from './ProjectsRenderer/navigationTreeProjectSearchCompare.js';
import { navigationTreeProjectsExpandStateGetter } from './ProjectsRenderer/navigationTreeProjectsExpandStateGetter.js';
import { navigationTreeProjectsRendererRenderer } from './ProjectsRenderer/navigationTreeProjectsRendererRenderer.js';
import { ProjectsSettingsPlaceholderElement } from './ProjectsRenderer/ProjectsSettingsForm.js';
import { useNavigationTree } from './useNavigationTree.js';

const registry: StyleRegistry = [
  [
    ElementsTreeToolsStyles,
    {
      mode: 'append',
      styles: [elementsTreeToolsStyles],
    },
  ],
];

export const NavigationTree = observer(function NavigationTree() {
  const tree = useRef<IElementsTree>(null);
  const styles = useS(style);
  const projectsNavNodeService = useService(ProjectsNavNodeService);
  const projectsService = useService(ProjectsService);
  const navTreeService = useService(NavigationTreeService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeResource = useService(NavTreeResource);
  const navNodeViewService = useService(NavNodeViewService);

  const root = ROOT_NODE_PATH;
  const { handleOpen, handleSelect, handleSelectReset } = useNavigationTree();

  const connectionGroupFilter = useMemo(() => navigationTreeConnectionGroupFilter(navNodeInfoResource), [navNodeInfoResource]);

  const settings = useUserData<IElementsTreeSettings>(
    getNavigationTreeUserSettingsId(root),
    createElementsTreeSettings,
    () => {},
    validateElementsTreeSettings,
  );

  const duplicateFilter = useMemo(() => navigationTreeDuplicateFilter(navNodeViewService), [navNodeViewService]);
  const connectionRenderer = useMemo(() => navTreeConnectionRenderer(navNodeInfoResource), [navNodeInfoResource]);
  const projectsRendererRenderer = useMemo(() => navigationTreeProjectsRendererRenderer(navNodeInfoResource), [navNodeInfoResource]);
  const projectsExpandStateGetter = useMemo(
    () => navigationTreeProjectsExpandStateGetter(navNodeInfoResource, projectsService, projectsNavNodeService),
    [navNodeInfoResource, projectsService, projectsNavNodeService],
  );
  const transformFilteredNode = useMemo(() => transformFilteredNodeInfo(navNodeInfoResource), [navNodeInfoResource]);
  const transformDescriptionNode = useMemo(() => transformDescriptionNodeInfo(navNodeInfoResource), [navNodeInfoResource]);
  const projectFilter = useMemo(
    () => navigationTreeProjectFilter(projectsNavNodeService, projectsService, navNodeInfoResource, navTreeResource),
    [projectsNavNodeService, projectsService, navNodeInfoResource, navTreeResource],
  );

  const settingsElements = useMemo(() => [ProjectsSettingsPlaceholderElement, ObjectsDescriptionSettingsPlaceholderElement], []);

  useExecutor({
    executor: navTreeService.showNodeExecutor,
    handlers: [
      function showNode(data) {
        if (tree.current) {
          tree.current.show(data.id, data.path);
        }
      },
    ],
  });

  return (
    <SContext registry={registry}>
      <CaptureView view={navTreeService} className={s(styles, { captureView: true })}>
        <ElementsTree
          ref={tree}
          root={root}
          localState={navTreeService.treeState}
          filters={[duplicateFilter, connectionGroupFilter, projectFilter]}
          renderers={[projectsRendererRenderer, navigationTreeConnectionGroupRenderer, connectionRenderer]}
          navNodeFilterCompare={navigationTreeProjectSearchCompare}
          nodeInfoTransformers={[transformFilteredNode, transformDescriptionNode]}
          expandStateGetters={[projectsExpandStateGetter]}
          settingsElements={settingsElements}
          className={s(styles, { elementsTree: true })}
          emptyPlaceholder={() => (
            <div className={s(styles, { center: true })}>
              <div className={s(styles, { message: true })}>
                <Translate token="app_navigationTree_empty_placeholder" />
              </div>
            </div>
          )}
          customSelect={handleSelect}
          customSelectReset={handleSelectReset}
          settings={settings}
          getChildren={navTreeService.getChildren}
          loadChildren={navTreeService.loadNestedNodes}
          onOpen={handleOpen}
        />
      </CaptureView>
    </SContext>
  );
});

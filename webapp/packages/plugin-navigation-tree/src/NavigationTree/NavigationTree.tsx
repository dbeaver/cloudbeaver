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
import { Translate } from '@cloudbeaver/core-localization';
import { NavNodeInfoResource, NavTreeResource, ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';
import { ProjectsNavNodeService, ProjectsService } from '@cloudbeaver/core-projects';
import { usePermission, EPermission } from '@cloudbeaver/core-root';
import { CaptureView } from '@cloudbeaver/core-view';

import { NavNodeViewService } from '../NodesManager/NavNodeView/NavNodeViewService';
import { navigationTreeConnectionGroupFilter } from './ConnectionGroup/navigationTreeConnectionGroupFilter';
import { navigationTreeConnectionGroupRenderer } from './ConnectionGroup/navigationTreeConnectionGroupRenderer';
import { ElementsTree } from './ElementsTree/ElementsTree';
import { createElementsTreeSettings, validateElementsTreeSettings } from './ElementsTree/ElementsTreeTools/NavigationTreeSettings/createElementsTreeSettings';
import type { IElementsTreeSettings } from './ElementsTree/useElementsTree';
import { getNavigationTreeUserSettingsId } from './getNavigationTreeUserSettingsId';
import { navigationTreeDuplicateFilter } from './navigationTreeDuplicateIdFilter';
import { NavigationTreeService } from './NavigationTreeService';
import { navigationTreeProjectFilter } from './ProjectsRenderer/navigationTreeProjectFilter';
import { navigationTreeProjectSearchCompare } from './ProjectsRenderer/navigationTreeProjectSearchCompare';
import { navigationTreeProjectsExpandStateGetter } from './ProjectsRenderer/navigationTreeProjectsExpandStateGetter';
import { navigationTreeProjectsRendererRenderer } from './ProjectsRenderer/navigationTreeProjectsRendererRenderer';
import { ProjectsSettingsPlaceholderElement } from './ProjectsRenderer/ProjectsSettingsForm';
import { useNavigationTree } from './useNavigationTree';

const navigationTreeStyles = css`
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

  center {
    display: flex;
    height: 100%;
    width: 100%;

    & message {
      margin: auto;
      text-align: center;
    }
  }

  message {
    box-sizing: border-box;
    max-width: 240px;
    padding: 24px;
  }
`;

const elementsTreeStyles = css`
    tools {
      composes: theme-border-color-background from global;
    }
    tools > *:last-child:not(:first-child) {
      border-bottom: solid 1px;
      border-color: inherit;
    }
  `;

export const NavigationTree = observer(function NavigationTree() {
  const projectsNavNodeService = useService(ProjectsNavNodeService);
  const projectsService = useService(ProjectsService);
  const navTreeService = useService(NavigationTreeService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeResource = useService(NavTreeResource);
  const navNodeViewService = useService(NavNodeViewService);

  const root = ROOT_NODE_PATH;
  const isEnabled = usePermission(EPermission.public);
  const { handleOpen, handleSelect, handleSelectReset } = useNavigationTree();

  const connectionGroupFilter = useMemo(() => navigationTreeConnectionGroupFilter(
    navNodeInfoResource
  ), [navNodeInfoResource]);

  const settings = useUserData<IElementsTreeSettings>(
    getNavigationTreeUserSettingsId(root),
    createElementsTreeSettings,
    () => { },
    validateElementsTreeSettings
  );

  const duplicateFilter = useMemo(() => navigationTreeDuplicateFilter(navNodeViewService), [navNodeViewService]);
  const projectsRendererRenderer = useMemo(
    () => navigationTreeProjectsRendererRenderer(navNodeInfoResource),
    [navNodeInfoResource]
  );
  const projectsExpandStateGetter = useMemo(
    () => navigationTreeProjectsExpandStateGetter(navNodeInfoResource, projectsService, projectsNavNodeService),
    [navNodeInfoResource, projectsService, projectsNavNodeService]
  );
  const projectFilter = useMemo(
    () => navigationTreeProjectFilter(projectsNavNodeService, projectsService, navNodeInfoResource, navTreeResource),
    [projectsNavNodeService, projectsService, navNodeInfoResource, navTreeResource]
  );

  const settingsElements = useMemo(() => ([ProjectsSettingsPlaceholderElement]), []);

  if (!isEnabled) {
    return null;
  }

  return styled(navigationTreeStyles)(
    <CaptureView view={navTreeService}>
      <ElementsTree
        root={root}
        localState={navTreeService.treeState}
        filters={[duplicateFilter, connectionGroupFilter, projectFilter]}
        renderers={[projectsRendererRenderer, navigationTreeConnectionGroupRenderer]}
        navNodeFilterCompare={navigationTreeProjectSearchCompare}
        expandStateGetters={[projectsExpandStateGetter]}
        settingsElements={settingsElements}
        emptyPlaceholder={() => styled(navigationTreeStyles)(
          <center>
            <message>
              <Translate token='app_navigationTree_empty_placeholder' />
            </message>
          </center>
        )}
        customSelect={handleSelect}
        customSelectReset={handleSelectReset}
        settings={settings}
        style={elementsTreeStyles}
        getChildren={navTreeService.getChildren}
        loadChildren={navTreeService.loadNestedNodes}
        onOpen={handleOpen}
      />
    </CaptureView>
  );
});

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

import { Loader, useDataResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { CaptureView } from '@cloudbeaver/core-view';
import { NavigationTreeService, ElementsTree } from '@cloudbeaver/plugin-navigation-tree';

import { ResourceProjectsResource } from '../ResourceProjectsResource';
import { RESOURCES_NODE_PATH } from '../RESOURCES_NODE_PATH';
import { navigationTreeProjectFilter } from './ProjectsRenderer/navigationTreeProjectFilter';
import { navigationTreeProjectsExpandStateGetter } from './ProjectsRenderer/navigationTreeProjectsExpandStateGetter';
import { navigationTreeProjectsRendererRenderer } from './ProjectsRenderer/navigationTreeProjectsRendererRenderer';

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
  const translate = useTranslate();
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeResource = useService(NavTreeResource);
  const navTreeService = useService(NavigationTreeService);

  const { resource } = useDataResource(ResourceManagerTree, ResourceProjectsResource, undefined);

  const projectsRendererRenderer = useMemo(
    () => navigationTreeProjectsRendererRenderer(navNodeInfoResource),
    [navNodeInfoResource]
  );
  const projectsExpandStateGetter = useMemo(
    () => navigationTreeProjectsExpandStateGetter(navNodeInfoResource),
    [navNodeInfoResource]
  );
  const projectFilter = useMemo(
    () => navigationTreeProjectFilter(navNodeInfoResource, navTreeResource),
    [navNodeInfoResource, navTreeResource]
  );

  return styled(styles)(
    <Loader state={resource}>
      <CaptureView view={navTreeService}>
        <ElementsTree
          root={RESOURCES_NODE_PATH}
          getChildren={navTreeService.getChildren}
          loadChildren={navTreeService.loadNestedNodes}
          filters={[projectFilter]}
          renderers={[projectsRendererRenderer]}
          expandStateGetters={[projectsExpandStateGetter]}
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
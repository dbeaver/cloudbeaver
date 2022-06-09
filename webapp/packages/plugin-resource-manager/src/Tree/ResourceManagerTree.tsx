/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ElementsTree, NavigationTreeService, NavigationNodeControl } from '@cloudbeaver/core-app';
import { Loader, useDataResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { createPath } from '@cloudbeaver/core-utils';
import { CaptureView } from '@cloudbeaver/core-view';

import { ProjectsResource } from '../ProjectsResource';
import { RESOURCES_NODE_PATH } from '../RESOURCES_NODE_PATH';

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
  const navTreeService = useService(NavigationTreeService);

  const { resource } = useDataResource(ResourceManagerTree, ProjectsResource, undefined);

  return styled(styles)(
    <Loader state={resource}>
      <CaptureView view={navTreeService}>
        <ElementsTree
          root={createPath([RESOURCES_NODE_PATH, resource.userProject?.name])}
          getChildren={navTreeService.getChildren}
          loadChildren={navTreeService.loadNestedNodes}
          control={NavigationNodeControl}
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
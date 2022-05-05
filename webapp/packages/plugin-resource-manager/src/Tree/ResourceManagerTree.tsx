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
import { CaptureView } from '@cloudbeaver/core-view';

import { ProjectsResource } from '../ProjectsResource';
import { ScriptsManagerService } from '../ScriptsManager/ScriptsManagerService';

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
  div {
    text-align: center;
  }
`;


export const ResourceManagerTree = observer(function ResourceManagerTree() {
  const translate = useTranslate();
  const navTreeService = useService(NavigationTreeService);
  const scriptsManagerService = useService(ScriptsManagerService);

  const { resource } = useDataResource(ResourceManagerTree, ProjectsResource, undefined);


  return styled(styles)(
    <Loader state={[resource]}>
      <CaptureView view={navTreeService}>
        <ElementsTree
          root={scriptsManagerService.userProjectPath}
          getChildren={navTreeService.getChildren}
          loadChildren={navTreeService.loadNestedNodes}
          control={NavigationNodeControl}
          emptyPlaceholder={() => styled(styles)(
            <div>
              {translate('plugin_resource_manager_no_resources_placeholder')}
            </div>
          )}
          onOpen={scriptsManagerService.openScript}
        />
      </CaptureView>
    </Loader>
  );
});
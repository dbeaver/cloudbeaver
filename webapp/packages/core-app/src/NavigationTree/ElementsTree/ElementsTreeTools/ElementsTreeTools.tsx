/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import styled, { css, use } from 'reshadow';

import { IconButton } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { NavNodeInfoResource } from '../../../shared/NodesManager/NavNodeInfoResource';
import { ConnectionSchemaManagerService } from '../../../TopNavBar/ConnectionSchemaManager/ConnectionSchemaManagerService';
import { DATA_CONTEXT_ELEMENTS_TREE } from '../DATA_CONTEXT_ELEMENTS_TREE';
import { KEY_BINDING_COLLAPSE_ALL } from '../KEY_BINDING_COLLAPSE_ALL';
import { KEY_BINDING_LINK_OBJECT } from '../KEY_BINDING_LINK_OBJECT';
import type { IElementsTree } from '../useElementsTree';
import { ElementsTreeFilter } from './ElementsTreeFilter';
import { DATA_CONTEXT_NAV_TREE_ROOT } from './NavigationTreeSettings/DATA_CONTEXT_NAV_TREE_ROOT';
import { NavigationTreeSettings } from './NavigationTreeSettings/NavigationTreeSettings';

const toolsStyles = css`
    [|primary] {
      composes: theme-text-primary from global;
    }
    tools {
      composes: theme-background-surface from global;
      display: block;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    actions {
      display: flex;
      flex-direction: row;
    }
    fill {
      flex: 1;
    }
    IconButton {
      composes: theme-form-element-radius theme-ripple from global;
      padding: 4px;
      margin: 2px;
      width: 24px;
      height: 24px;
      overflow: hidden;

      & Icon, & StaticImage {
        transition: transform .3s ease-in-out;
      }

      &[|opened] Icon, &[|opened] StaticImage {
        transform: rotate(180deg);
      }
    }
  `;

interface Props {
  tree: IElementsTree;
  style?: ComponentStyle;
}

export const ElementsTreeTools = observer<Props>(function ElementsTreeTools({
  tree,
  style,
  children,
}) {
  const translate = useTranslate();
  const navNodeInfoResource  = useService(NavNodeInfoResource);
  const connectionSchemaManagerService = useService(ConnectionSchemaManagerService);
  const [opened, setOpen] = useState(false);
  const styles = useStyles(toolsStyles, style);

  useCaptureViewContext(context => {
    context?.set(DATA_CONTEXT_NAV_TREE_ROOT, tree.baseRoot);
    context?.set(DATA_CONTEXT_ELEMENTS_TREE, tree);
  });

  const activeNavNode = connectionSchemaManagerService.activeNavNode;
  const nodeInTree = activeNavNode?.path.includes(tree.baseRoot) && navNodeInfoResource.has(activeNavNode.nodeId);

  function showObject() {
    if (activeNavNode && nodeInTree) {
      tree.show(
        activeNavNode.nodeId,
        activeNavNode.path
      );
    }
  }

  return styled(styles)(
    <tools>
      <actions>
        <fill />
        {activeNavNode && nodeInTree && (
          <IconButton
            name='/icons/link_editor_sm.svg'
            title={translate('app_navigationTree_action_link_with_editor') + ` (${KEY_BINDING_LINK_OBJECT.label})`}
            style={toolsStyles}
            img
            onMouseDown={showObject}
          />
        )}
        <IconButton
          name='/icons/collapse_sm.svg'
          title={translate('app_navigationTree_action_collapse_all') + ` (${KEY_BINDING_COLLAPSE_ALL.label})`}
          style={toolsStyles}
          img
          onClick={tree.collapse}
          {...use({ primary: true })}
        />
        {tree.settings?.configurable && (
          <IconButton
            name='/icons/settings_cog_sm.svg'
            title={translate('ui_settings')}
            style={toolsStyles}
            img
            onClick={() => setOpen(!opened)}
            {...use({ opened, primary: true })}
          />
        )}
      </actions>
      {tree.settings && opened && (
        <NavigationTreeSettings root={tree.baseRoot} settings={tree.settings} style={style} />
      )}
      <ElementsTreeFilter tree={tree} style={style} />
      {children}
    </tools>
  );
});
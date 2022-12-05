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

import { ACTION_ICON_BUTTON_STYLES, IconButton, PlaceholderElement, useMapResource, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_ELEMENTS_TREE } from '../DATA_CONTEXT_ELEMENTS_TREE';
import type { IElementsTree } from '../useElementsTree';
import { ElementsTreeFilter } from './ElementsTreeFilter';
import { ElementsTreeToolsMenu } from './ElementsTreeToolsMenu';
import { DATA_CONTEXT_NAV_TREE_ROOT } from './NavigationTreeSettings/DATA_CONTEXT_NAV_TREE_ROOT';
import type { IElementsTreeSettingsProps } from './NavigationTreeSettings/ElementsTreeSettingsService';
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
      & Icon, & StaticImage {
        transition: transform .3s ease-in-out;
      }

      &[|opened] Icon, &[|opened] StaticImage {
        transform: rotate(180deg);
      }

      &[|loading] Icon, &[|loading] StaticImage {
        animation: rotating 1.5s linear infinite;
      }
    }
    @keyframes rotating {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `;

interface Props {
  tree: IElementsTree;
  settingsElements?: PlaceholderElement<IElementsTreeSettingsProps>[];
  style?: ComponentStyle;
}

export const ElementsTreeTools = observer<React.PropsWithChildren<Props>>(function ElementsTreeTools({
  tree,
  settingsElements,
  style,
  children,
}) {
  const root = tree.root;
  const translate = useTranslate();
  const [opened, setOpen] = useState(false);
  const styles = useStyles(ACTION_ICON_BUTTON_STYLES, toolsStyles, style);
  const rootNode = useMapResource(ElementsTreeTools, NavTreeResource, root);

  useCaptureViewContext(context => {
    context?.set(DATA_CONTEXT_NAV_TREE_ROOT, tree.baseRoot);
    context?.set(DATA_CONTEXT_ELEMENTS_TREE, tree);
  });

  const loading = rootNode.isLoading();

  return styled(styles)(
    <tools>
      <actions>
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
        <fill />
        <ElementsTreeToolsMenu tree={tree} />
        <IconButton
          name='/icons/refresh_sm.svg#root'
          title={translate('app_navigationTree_refresh')}
          style={toolsStyles}
          disabled={loading}
          img
          onClick={() => tree.refresh(root)}
          {...use({ primary: true, loading })}
        />
      </actions>
      {tree.settings && opened && (
        <NavigationTreeSettings tree={tree} elements={settingsElements} style={style} />
      )}
      <ElementsTreeFilter tree={tree} style={style} />
      {children}
    </tools>
  );
});
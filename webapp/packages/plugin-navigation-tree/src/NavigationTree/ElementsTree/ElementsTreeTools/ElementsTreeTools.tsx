/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import {
  ActionIconButton,
  Fill,
  IconButtonStyles,
  type PlaceholderElement,
  s,
  SContext,
  type StyleRegistry,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_ELEMENTS_TREE } from '../DATA_CONTEXT_ELEMENTS_TREE.js';
import type { IElementsTree } from '../useElementsTree.js';
import { ElementsTreeFilter } from './ElementsTreeFilter.js';
import ElementsTreeToolsStyles from './ElementsTreeTools.module.css';
import ElementsTreeToolsIconButtonStyles from './ElementsTreeToolsIconButton.module.css';
import { ElementsTreeToolsMenu } from './ElementsTreeToolsMenu.js';
import { DATA_CONTEXT_NAV_TREE_ROOT } from './NavigationTreeSettings/DATA_CONTEXT_NAV_TREE_ROOT.js';
import type { IElementsTreeSettingsProps } from './NavigationTreeSettings/ElementsTreeSettingsService.js';
import { NavigationTreeSettings } from './NavigationTreeSettings/NavigationTreeSettings.js';

const registry: StyleRegistry = [
  [
    IconButtonStyles,
    {
      mode: 'append',
      styles: [ElementsTreeToolsIconButtonStyles],
    },
  ],
];

interface Props {
  tree: IElementsTree;
  settingsElements?: PlaceholderElement<IElementsTreeSettingsProps>[];
}

export const ElementsTreeTools = observer<React.PropsWithChildren<Props>>(function ElementsTreeTools({ tree, settingsElements, children }) {
  const root = tree.root;
  const baseRoot = tree.baseRoot;
  const translate = useTranslate();
  const [opened, setOpen] = useState(false);
  const styles = useS(ElementsTreeToolsStyles, ElementsTreeToolsIconButtonStyles);

  useCaptureViewContext((context, id) => {
    context.set(DATA_CONTEXT_NAV_TREE_ROOT, baseRoot, id);
    context.set(DATA_CONTEXT_ELEMENTS_TREE, tree, id);
  });

  const loading = tree.isLoading();

  return (
    <SContext registry={registry}>
      <div className={s(styles, { tools: true })}>
        <div className={s(styles, { actions: true })}>
          {tree.settings?.configurable && (
            <ActionIconButton
              name="/icons/settings_cog_sm.svg"
              title={translate('ui_settings')}
              className={s(styles, { primary: true, opened })}
              img
              onClick={() => setOpen(!opened)}
            />
          )}
          <Fill />
          <ElementsTreeToolsMenu tree={tree} />
          <ActionIconButton
            name="/icons/refresh_sm.svg"
            title={translate('app_navigationTree_refresh')}
            disabled={loading}
            className={s(styles, { primary: true, loading })}
            img
            onClick={() => tree.refresh(root)}
          />
        </div>
        {tree.settings && opened && <NavigationTreeSettings tree={tree} elements={settingsElements} />}
        <ElementsTreeFilter tree={tree} />
        {children}
      </div>
    </SContext>
  );
});

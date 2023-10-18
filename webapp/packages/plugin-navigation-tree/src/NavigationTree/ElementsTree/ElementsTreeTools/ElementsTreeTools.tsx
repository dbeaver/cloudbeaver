/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import styled from 'reshadow';

import {
  ActionIconButton,
  Fill,
  IconButtonStyles,
  PlaceholderElement,
  s,
  SContext,
  StyleRegistry,
  useS,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_ELEMENTS_TREE } from '../DATA_CONTEXT_ELEMENTS_TREE';
import type { IElementsTree } from '../useElementsTree';
import { ElementsTreeFilter } from './ElementsTreeFilter';
import ElementsTreeToolsStyles from './ElementsTreeTools.m.css';
import ElementsTreeToolsIconButtonStyles from './ElementsTreeToolsIconButton.m.css';
import { ElementsTreeToolsMenu } from './ElementsTreeToolsMenu';
import { DATA_CONTEXT_NAV_TREE_ROOT } from './NavigationTreeSettings/DATA_CONTEXT_NAV_TREE_ROOT';
import type { IElementsTreeSettingsProps } from './NavigationTreeSettings/ElementsTreeSettingsService';
import { NavigationTreeSettings } from './NavigationTreeSettings/NavigationTreeSettings';

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
  style?: ComponentStyle;
}

export const ElementsTreeTools = observer<React.PropsWithChildren<Props>>(function ElementsTreeTools({ tree, settingsElements, style, children }) {
  const root = tree.root;
  const translate = useTranslate();
  const [opened, setOpen] = useState(false);
  const deprecatedStyles = useStyles(style);
  const styles = useS(ElementsTreeToolsStyles, ElementsTreeToolsIconButtonStyles);

  useCaptureViewContext(context => {
    context?.set(DATA_CONTEXT_NAV_TREE_ROOT, tree.baseRoot);
    context?.set(DATA_CONTEXT_ELEMENTS_TREE, tree);
  });

  const loading = tree.isLoading();

  return styled(deprecatedStyles)(
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
            name="/icons/refresh_sm.svg#root"
            title={translate('app_navigationTree_refresh')}
            disabled={loading}
            className={s(styles, { primary: true, loading })}
            img
            onClick={() => tree.refresh(root)}
          />
        </div>
        {tree.settings && opened && <NavigationTreeSettings tree={tree} elements={settingsElements} style={style} />}
        <ElementsTreeFilter tree={tree} style={style} />
        {children}
      </div>
    </SContext>,
  );
});

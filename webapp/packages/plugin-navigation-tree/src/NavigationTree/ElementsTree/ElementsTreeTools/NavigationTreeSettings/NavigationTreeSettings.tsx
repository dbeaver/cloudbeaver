/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Group, Loader, Placeholder, PlaceholderElement, s, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { ElementsTreeSettingsService, IElementsTreeSettingsProps } from './ElementsTreeSettingsService';
import NavigationTreeSettingsStyles from './NavigationTreeSettings.m.css';

interface Props extends IElementsTreeSettingsProps {
  elements?: PlaceholderElement<IElementsTreeSettingsProps>[];
  className?: string;
}

export const NavigationTreeSettings = observer<Props>(function NavigationTreeSettings({ elements, tree, style, className }) {
  const elementsTreeSettingsService = useService(ElementsTreeSettingsService);
  const styles = useS(NavigationTreeSettingsStyles);

  return (
    <div className={s(styles, { settings: true }, className)}>
      <Group className={s(styles, { group: true, groupPadding: true })} keepSize gap dense>
        <Loader suspense>
          <Placeholder container={elementsTreeSettingsService.placeholder} elements={elements} tree={tree} style={style} />
        </Loader>
      </Group>
    </div>
  );
});

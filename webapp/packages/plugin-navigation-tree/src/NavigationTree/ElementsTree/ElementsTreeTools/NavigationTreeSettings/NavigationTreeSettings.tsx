/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Group, Loader, Placeholder, PlaceholderElement, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { ElementsTreeSettingsService, IElementsTreeSettingsProps } from './ElementsTreeSettingsService';

const expandStyles = css`
  settings {
    display: flex;
    flex-direction: row;
  }
  Group {
    min-width: 350px;
    width: min-content;

    &[dense] {
      padding: 12px;
    }
  }
`;

interface Props extends IElementsTreeSettingsProps {
  elements?: PlaceholderElement<IElementsTreeSettingsProps>[];
  className?: string;
}

export const NavigationTreeSettings = observer<Props>(function NavigationTreeSettings({ elements, tree, style, className }) {
  const styles = useStyles(expandStyles, style);
  const elementsTreeSettingsService = useService(ElementsTreeSettingsService);

  return styled(styles)(
    <settings className={className}>
      <Group keepSize form gap dense>
        <Loader suspense>
          <Placeholder container={elementsTreeSettingsService.placeholder} elements={elements} tree={tree} style={style} />
        </Loader>
      </Group>
    </settings>,
  );
});

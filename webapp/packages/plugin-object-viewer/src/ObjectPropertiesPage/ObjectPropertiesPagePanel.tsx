/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import type { ObjectPagePanelComponent } from '../ObjectPage/ObjectPage';
import { ObjectFolders } from './ObjectFolders';

const viewerStyles = css`
    wrapper {
      composes: theme-background-surface from global;
      display: flex;
      width: 100%;
      flex: 1 1 auto;
      padding-top: 16px; /* TODO: must be refactored */
    }
  `;

export const ObjectPropertiesPagePanel: ObjectPagePanelComponent = observer(function ObjectPropertiesPagePanel({
  tab,
}) {
  const style = useStyles(viewerStyles);

  return styled(style)(
    <wrapper>
      <ObjectFolders tab={tab} />
    </wrapper>
  );
});

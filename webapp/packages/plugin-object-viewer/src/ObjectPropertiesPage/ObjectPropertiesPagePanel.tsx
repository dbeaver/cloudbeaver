/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import type { ObjectPagePanelComponent } from '../ObjectPage/ObjectPage';
import { ObjectFolders } from './ObjectFolders';

const viewerStyles = css`
  wrapper {
    composes: theme-background-surface from global;
    display: flex;
    width: 100%;
    flex: 1 1 auto;
    padding-top: 8px;
  }
`;

export const ObjectPropertiesPagePanel: ObjectPagePanelComponent = observer(function ObjectPropertiesPagePanel({ tab }) {
  return styled(viewerStyles)(
    <wrapper>
      <ObjectFolders tab={tab} />
    </wrapper>,
  );
});

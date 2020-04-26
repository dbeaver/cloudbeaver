/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useChildren } from '@dbeaver/core/app';
import { Loader } from '@dbeaver/core/blocks';
import { useStyles, composes } from '@dbeaver/core/theming';

import { ObjectPagePanelProps } from '../ObjectPage/ObjectPage';
import { ObjectFolders } from './ObjectFolders';

const viewerStyles = composes(
  css`
    wrapper {
      composes: theme-background-surface from global;
    }
  `,
  css`
    wrapper {
      display: flex;
      width: 100%;
      flex: 1 1 auto;
      padding-top: 16px; /* TODO: must be refactored */
    }
  `
);

export const ObjectPropertiesPagePanel = observer(function ObjectPropertiesPagePanel({
  tab,
}: ObjectPagePanelProps) {
  const children = useChildren(tab.handlerState.objectId);

  if (!children?.isLoaded) {
    return <Loader />;
  }

  return styled(useStyles(viewerStyles))(
    <wrapper as="div">
      <ObjectFolders tab={tab} />
    </wrapper>
  );
});

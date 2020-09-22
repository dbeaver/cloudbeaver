/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useChildren } from '@cloudbeaver/core-app';
import { Loader, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

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
  const style = useStyles(viewerStyles);
  const { children, isLoading } = useChildren(tab.handlerState.objectId);

  if (!children && isLoading) {
    return <Loader />;
  }

  if (!children) {
    return <TextPlaceholder><Translate token='plugin_object_viewer_table_no_items' /></TextPlaceholder>;
  }

  return styled(style)(
    <wrapper as="div">
      <ObjectFolders tab={tab} />
    </wrapper>
  );
});

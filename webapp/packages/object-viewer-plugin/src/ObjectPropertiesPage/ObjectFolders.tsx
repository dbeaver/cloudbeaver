/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { ITab } from '@dbeaver/core/app';
import { VerticalTabs } from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/di';
import { useStyles } from '@dbeaver/core/theming';

import { IObjectViewerTabState } from '../IObjectViewerTabState';
import { ObjectFoldersController } from './ObjectFoldersController';

const styles = css`
  folders {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
`;

type ObjectFoldersProps = {
  tab: ITab<IObjectViewerTabState>;
}

export const ObjectFolders = observer(function ObjectFolders({ tab }: ObjectFoldersProps) {
  const controller = useController(ObjectFoldersController, tab);

  return styled(useStyles(styles))(
    <folders as="div">
      <VerticalTabs tabContainer={controller.getTabContainer()}/>
    </folders>
  );
});

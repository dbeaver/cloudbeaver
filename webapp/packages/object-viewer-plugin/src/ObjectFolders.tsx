/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { VerticalTabs } from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/src/di/useController';
import { useStyles } from '@dbeaver/core/theming';

import { ObjectFoldersController } from './ObjectFoldersController';

const styles = css`
  folders {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
`;

type ObjectFoldersProps = {
  objectId: string;
}

export function ObjectFolders({ objectId }: ObjectFoldersProps) {
  const controller = useController(ObjectFoldersController, objectId);

  return styled(useStyles(styles))(
    <folders as="div">
      <VerticalTabs tabContainer={controller.getTabContainer()}/>
    </folders>
  );
}

/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { ObjectChildrenPropertyTable } from '../ObjectPropertyTable/ObjectChildrenPropertyTable';
import { VirtualFolderTabMixin } from './VirtualFolderTabMixin';

const style = css`
  tab-wrapper {
    position: relative;
    display: flex;
    width: 100%;
    flex: 1 0 auto;
  }
`;

export const VirtualFolderTab = observer(function VirtualFolderTab() {
  const folderMixin = useService(VirtualFolderTabMixin);

  if (!folderMixin.isActivated) {
    return <Loader />;
  }

  return styled(style)(
    <tab-wrapper as="div">
      <ObjectChildrenPropertyTable nodeIds={folderMixin.getChildrenId()} />
    </tab-wrapper>
  );
});

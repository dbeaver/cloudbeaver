/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { IconOrImage } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { useStyles } from '@cloudbeaver/core-theming';

import { ShortcutsDialog } from './Shortcuts/ShortcutsDialog';

const styles = css`
    container {
      composes: theme-ripple from global;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 16px;
      cursor: pointer;  
      & IconOrImage {
        width: 24px;
      }
    }
  `;

export const Help = observer(function Help() {
  const style = useStyles(styles);
  const commonDialogService = useService(CommonDialogService);

  return styled(style)(
    <container onClick={() => commonDialogService.open(ShortcutsDialog, null)}>
      <IconOrImage icon='info' viewBox='0 0 24 24' />
    </container>
  );
});
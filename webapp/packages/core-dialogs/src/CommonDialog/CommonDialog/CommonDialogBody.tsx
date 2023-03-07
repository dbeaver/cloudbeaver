/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { dialogStyles } from '../styles';
import { commonDialogBaseStyle, commonDialogThemeStyle } from './styles';

interface Props {
  noBodyPadding?: boolean;
  noOverflow?: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: ComponentStyle;
}

export const CommonDialogBody = observer<Props>(function CommonDialogBody({
  noBodyPadding,
  noOverflow,
  className,
  children,
  style,
}) {

  return styled(useStyles(commonDialogThemeStyle, commonDialogBaseStyle, dialogStyles, style))(
    <dialog-body className={className} {...use({ 'no-padding': noBodyPadding, 'no-overflow': noOverflow })}>
      <dialog-body-overflow-box>
        <dialog-body-content>
          {children}
        </dialog-body-content>
        {!noOverflow && <dialog-body-overflow />}
      </dialog-body-overflow-box>
    </dialog-body>
  );
});

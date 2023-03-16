/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { dialogStyles } from '../styles';
import { commonDialogBaseStyle, commonDialogThemeStyle } from './styles';

interface Props {
  className?: string;
  children?: React.ReactNode;
  style?: ComponentStyle;
}

export const CommonDialogFooter = observer<Props>(function CommonDialogFooter({
  children,
  className,
  style,
}) {
  return styled(useStyles(commonDialogThemeStyle, commonDialogBaseStyle, dialogStyles, style))(
    <footer className={className}>
      {children}
    </footer>
  );
});

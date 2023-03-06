/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useRef } from 'react';
import { Dialog, useDialogState } from 'reakit/Dialog';
import styled, { use } from 'reshadow';

import { useStyles, Loader } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { DialogContext } from '../DialogContext';
import { dialogStyles } from '../styles';
import { commonDialogBaseStyle, commonDialogThemeStyle } from './styles';

export interface CommonDialogWrapperProps {
  size?: 'small' | 'medium' | 'large';
  'aria-label'?: string;
  fixedSize?: boolean;
  fixedWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: ComponentStyle;
}

export const CommonDialogWrapper = observer<CommonDialogWrapperProps>(function CommonDialogWrapper({
  size = 'medium',
  fixedSize,
  fixedWidth,
  'aria-label': ariaLabel,
  className,
  children,
  style,
}) {
  const context = useContext(DialogContext);
  const dialogState = useDialogState({ visible: true });
  const focusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!dialogState.visible && !context.dialog.options?.persistent) {
      context.reject();
    }
  });

  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      focusedElementRef.current = document.activeElement;
    }

    return () => {
      focusedElementRef.current?.focus();
    };
  }, []);

  return styled(useStyles(commonDialogThemeStyle, commonDialogBaseStyle, dialogStyles, style))(
    <Dialog {...dialogState} aria-label={ariaLabel} visible={context.visible} hideOnClickOutside={false} modal={false}>
      <dialog className={className} {...use({ size, fixedSize, fixedWidth })}>
        <Loader suspense>
          {children}
        </Loader>
      </dialog>
    </Dialog>
  );
});

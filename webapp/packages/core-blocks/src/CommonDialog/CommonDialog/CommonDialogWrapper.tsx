/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useContext, useEffect } from 'react';
import { Dialog, useDialogState } from 'reakit/Dialog';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { Loader } from '../../Loader/Loader';
import { s } from '../../s';
import { useS } from '../../useS';
import { DialogContext } from '../DialogContext';
import styles from './CommonDialogWrapper.m.css';

export interface CommonDialogWrapperProps {
  size?: 'small' | 'medium' | 'large';
  'aria-label'?: string;
  fixedSize?: boolean;
  fixedWidth?: boolean;
  freeHeight?: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: ComponentStyle;
}

export const CommonDialogWrapper = observer<CommonDialogWrapperProps, HTMLDivElement>(
  forwardRef(function CommonDialogWrapper(
    { size = 'medium', fixedSize, fixedWidth, freeHeight, 'aria-label': ariaLabel, className, children, style },
    ref,
  ) {
    const computedStyles = useS(styles, style);
    const context = useContext(DialogContext);
    const dialogState = useDialogState({ visible: true });

    useEffect(() => {
      if (!dialogState.visible && !context.dialog.options?.persistent) {
        context.reject();
      }
    });

    return (
      <Dialog
        {...dialogState}
        ref={ref}
        aria-label={ariaLabel}
        className={s(computedStyles, { container: true })}
        visible={context.visible}
        hideOnClickOutside={false}
        modal={false}
      >
        <dialog
          className={s(
            computedStyles,
            { dialog: true, small: size === 'small', medium: size === 'medium', large: size === 'large', fixedSize, fixedWidth, freeHeight },
            className,
          )}
        >
          <Loader className={s(computedStyles, { loader: true })} suspense>
            {children}
          </Loader>
        </dialog>
      </Dialog>
    );
  }),
);

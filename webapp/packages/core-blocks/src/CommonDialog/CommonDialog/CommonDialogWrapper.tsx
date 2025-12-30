/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useContext } from 'react';

import { Dialog } from '@dbeaver/ui-kit';
import { Loader } from '../../Loader/Loader.js';
import { s } from '../../s.js';
import { useS } from '../../useS.js';
import { DialogContext } from '../DialogContext.js';
import styles from './CommonDialogWrapper.module.css';

export type CommonDialogWrapperSize = 'small' | 'medium' | 'large';

export interface CommonDialogWrapperProps {
  size?: CommonDialogWrapperSize;
  'aria-label'?: string;
  fixedSize?: boolean;
  fixedWidth?: boolean;
  freeHeight?: boolean;
  className?: string;
  children?: React.ReactNode;
  autoFocusOnHide?: boolean | ((element: HTMLElement | null) => boolean) | undefined;
  autoFocusOnShow?: boolean | ((element: HTMLElement | null) => boolean) | undefined;
  initialFocus?: HTMLElement | React.RefObject<HTMLElement | null> | null | undefined;
}

export const CommonDialogWrapper = observer<CommonDialogWrapperProps, HTMLDivElement>(
  forwardRef(function CommonDialogWrapper(
    {
      size = 'medium',
      fixedSize,
      fixedWidth,
      freeHeight,
      'aria-label': ariaLabel,
      autoFocusOnHide = true,
      autoFocusOnShow = true,
      className,
      initialFocus,
      children,
    },
    ref,
  ) {
    const computedStyles = useS(styles);
    const context = useContext(DialogContext);

    function handleClose() {
      if (!context.dialog.options?.persistent) {
        context.reject();
      }
    }

    return (
      <Dialog
        ref={ref}
        aria-label={ariaLabel}
        open={context.visible}
        data-size={size}
        className={s(computedStyles, { dialog: true, fixedSize, fixedWidth, freeHeight }, className)}
        autoFocusOnShow={autoFocusOnShow}
        autoFocusOnHide={autoFocusOnHide}
        initialFocus={initialFocus as HTMLElement | React.RefObject<HTMLElement> | null | undefined}
        onClose={handleClose}
      >
        <Loader className={s(computedStyles, { loader: true })} suspense>
          {children}
        </Loader>
      </Dialog>
    );
  }),
);

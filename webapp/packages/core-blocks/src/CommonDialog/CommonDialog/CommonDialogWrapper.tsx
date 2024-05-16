/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useContext, useEffect } from 'react';
import { Dialog, useDialogState } from 'reakit/Dialog';

import { Loader } from '../../Loader/Loader';
import { s } from '../../s';
import { useFocus } from '../../useFocus';
import { useS } from '../../useS';
import { DialogContext } from '../DialogContext';
import styles from './CommonDialogWrapper.m.css';

export interface CommonDialogWrapperProps {
  size?: 'small' | 'medium' | 'large';
  'aria-label'?: string;
  fixedSize?: boolean;
  fixedWidth?: boolean;
  freeHeight?: boolean;
  autofocus?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const CommonDialogWrapper = observer<CommonDialogWrapperProps, HTMLDivElement>(
  forwardRef(function CommonDialogWrapper(
    { size = 'medium', fixedSize, fixedWidth, freeHeight, autofocus = true, 'aria-label': ariaLabel, className, children },
    ref,
  ) {
    const [focusedRef] = useFocus({ autofocus });
    const computedStyles = useS(styles);
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
          ref={focusedRef}
          tabIndex={0}
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

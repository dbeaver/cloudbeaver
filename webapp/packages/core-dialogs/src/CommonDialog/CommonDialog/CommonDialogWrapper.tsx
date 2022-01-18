/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useEffect } from 'react';
import { Dialog, useDialogState } from 'reakit/Dialog';
import styled, { use } from 'reshadow';

import { Icon, IconOrImage } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { DialogContext } from '../DialogContext';
import { dialogStyles } from '../styles';
import { commonDialogBaseStyle, commonDialogThemeStyle } from './styles';

export interface CommonDialogWrapperProps {
  size?: 'small' | 'medium' | 'large';
  title?: string;
  subTitle?: string | React.ReactNode;
  'aria-label'?: string;
  icon?: string;
  viewBox?: string;
  fixedSize?: boolean;
  fixedWidth?: boolean;
  bigIcon?: boolean;
  noBodyPadding?: boolean;
  noOverflow?: boolean;
  onReject?: () => void;
  className?: string;
  footer?: JSX.Element | boolean;
  children?: React.ReactNode;
  style?: ComponentStyle;
}

export const CommonDialogWrapper = observer<CommonDialogWrapperProps>(function CommonDialogWrapper({
  size = 'medium',
  fixedSize,
  fixedWidth,
  title,
  subTitle,
  'aria-label': ariaLabel,
  icon,
  viewBox,
  bigIcon,
  footer,
  noBodyPadding,
  noOverflow,
  className,
  onReject,
  children,
  style,
}) {
  const context = useContext(DialogContext);
  const translate = useTranslate();
  const dialogState = useDialogState({ visible: true });

  useEffect(() => {
    if (!dialogState.visible && !context.dialog.options?.persistent) {
      context.reject();
    }
  });

  return styled(useStyles(commonDialogThemeStyle, commonDialogBaseStyle, dialogStyles, style))(
    <Dialog {...dialogState} aria-label={ariaLabel} visible={context.visible} hideOnClickOutside={false} modal={false}>
      <dialog className={className} {...use({ size, fixedSize, fixedWidth })}>
        <header>
          <icon-container>
            {icon && <IconOrImage {...use({ bigIcon })} icon={icon} viewBox={viewBox} />}
          </icon-container>
          <header-title>
            <h3>{translate(title)}</h3>
            {onReject && (
              <reject>
                <Icon name="cross" viewBox="0 0 16 16" onClick={onReject} />
              </reject>
            )}
          </header-title>
          {subTitle && <sub-title>{typeof subTitle === 'string' ? translate(subTitle) : subTitle}</sub-title>}
        </header>
        <dialog-body {...use({ 'no-padding': noBodyPadding, 'no-overflow': noOverflow })}>
          <dialog-body-overflow-box>
            <dialog-body-content>
              {children}
            </dialog-body-content>
            {!noOverflow && <dialog-body-overflow />}
          </dialog-body-overflow-box>
        </dialog-body>
        <footer>
          {footer}
        </footer>
      </dialog>
    </Dialog>
  );
});

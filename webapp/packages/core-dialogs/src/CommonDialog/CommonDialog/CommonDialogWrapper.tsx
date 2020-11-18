/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use } from 'reshadow';

import { Icon, IconOrImage } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

import { commonDialogStyle } from './styles';

export interface CommonDialogWrapperProps {
  title?: string;
  icon?: string;
  viewBox?: string;
  error?: boolean;
  onReject?: () => void;
  className?: string;
  noBodyPadding?: boolean;
  footer?: JSX.Element | boolean;
  header?: JSX.Element | boolean;
  children?: React.ReactNode;
}

export const CommonDialogWrapper: React.FC<CommonDialogWrapperProps> = function CommonDialogWrapper({
  title,
  icon,
  viewBox,
  error,
  header,
  footer,
  noBodyPadding,
  className,
  onReject,
  children,
}) {
  if (!icon && error) {
    icon = '/icons/error_icon.svg';
  }
  return styled(useStyles(commonDialogStyle))(
    <dialog className={className}>
      <header>
        <header-title as="div">
          {icon && <IconOrImage {...use({ error })} icon={icon} viewBox={viewBox} />}
          <h1>{title}</h1>
          {onReject && (
            <reject as="div">
              <Icon name="cross" viewBox="0 0 16 16" onClick={onReject} />
            </reject>
          )}
        </header-title>
        {header}
      </header>
      <dialog-body as="div" {...use({ noPadding: noBodyPadding })}>{children}</dialog-body>
      <footer>
        {footer}
      </footer>
    </dialog>
  );
};

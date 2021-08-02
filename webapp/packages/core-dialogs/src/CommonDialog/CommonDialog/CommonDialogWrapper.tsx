/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use } from 'reshadow';

import { Icon, IconOrImage } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

import { commonDialogBaseStyle, commonDialogThemeStyle } from './styles';

export interface CommonDialogWrapperProps {
  title?: string;
  subTitle?: string;
  icon?: string;
  viewBox?: string;
  bigIcon?: boolean;
  onReject?: () => void;
  className?: string;
  footer?: JSX.Element | boolean;
  children?: React.ReactNode;
}

export const CommonDialogWrapper: React.FC<CommonDialogWrapperProps> = function CommonDialogWrapper({
  title,
  subTitle,
  icon,
  viewBox,
  bigIcon,
  footer,
  className,
  onReject,
  children,
}) {
  return styled(useStyles(commonDialogThemeStyle, commonDialogBaseStyle))(
    <dialog className={className}>
      <header>
        <icon-container>
          {icon && <IconOrImage {...use({ bigIcon })} icon={icon} viewBox={viewBox} />}
        </icon-container>
        <header-title>
          <h3>{title}</h3>
          {onReject && (
            <reject>
              <Icon name="cross" viewBox="0 0 16 16" onClick={onReject} />
            </reject>
          )}
        </header-title>
        {subTitle && <sub-title>{subTitle}</sub-title>}
      </header>
      <dialog-body>
        <dialog-body-content>
          {children}
        </dialog-body-content>
        <dialog-body-overflow />
      </dialog-body>
      <footer>
        {footer}
      </footer>
    </dialog>
  );
};

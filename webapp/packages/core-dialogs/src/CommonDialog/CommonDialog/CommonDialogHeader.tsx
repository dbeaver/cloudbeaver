/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { use } from 'reshadow';

import { Icon, IconOrImage, useTranslate, useStyles } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { dialogStyles } from '../styles';
import { commonDialogBaseStyle, commonDialogThemeStyle } from './styles';

interface Props {
  title?: string;
  subTitle?: string | React.ReactNode;
  icon?: string;
  viewBox?: string;
  bigIcon?: boolean;
  onReject?: () => void;
  className?: string;
  style?: ComponentStyle;
}

export const CommonDialogHeader = observer<Props>(function CommonDialogHeader({
  title,
  subTitle,
  icon,
  viewBox,
  bigIcon,
  className,
  onReject,
  style,
}) {
  const translate = useTranslate();

  return styled(useStyles(commonDialogThemeStyle, commonDialogBaseStyle, dialogStyles, style))(
    <header className={className}>
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
  );
});

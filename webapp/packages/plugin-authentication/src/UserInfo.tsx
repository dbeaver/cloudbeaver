/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { IconOrImage } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { UserInfo as IUserInfo } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

const styles = css`
  user {
    height: 100%;
    display: flex;
    align-items: center;
  }
  IconOrImage {
    display: block;
    width: 24px;
  }
  user-name {
    display: block;
    line-height: initial;
    margin-left: 8px;
  }
`;

const detachedStyles = composes(
  css`
    user {
      composes: theme-ripple from global;
    }
  `,
  css`
    user {
      padding: 0 16px;
      cursor: pointer;
    }
  `
);

interface Props {
  info: IUserInfo;
  detached?: boolean;
  tooltip?: string;
  onClick?: () => void;
}

export const UserInfo = observer<Props>(function UserInfo({ info, detached, tooltip, onClick }) {
  const translate = useTranslate();
  const style = useStyles(styles, detached && detachedStyles);

  return styled(style)(
    <user title={translate(tooltip)} onClick={onClick}>
      <user-icon>
        <IconOrImage icon='user' viewBox='0 0 28 28' />
      </user-icon>
      <user-name>{info.displayName || info.userId}</user-name>
    </user>
  );
});

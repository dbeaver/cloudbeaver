/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { Button } from './Button';
import { IconOrImage } from './IconOrImage';

const styles = css`
  message {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    border-radius: 4px;
    height: 50px;
    padding: 8px 12px;  
  }

  IconOrImage {
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }

  message-body {
    composes: theme-typography--body2 from global;
    max-height: 100%;
    line-height: 1.2;
    box-sizing: border-box;
    flex: 1;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  message-actions {
    margin-left: 16px;
  }
`;

interface Props {
  hasDetails?: boolean;
  text: string;
  className?: string;
  onShowDetails?: () => void;
}

export const ErrorMessage = observer<Props>(function ErrorMessage({
  text,
  className,
  hasDetails,
  onShowDetails,
}) {
  const translate = useTranslate();

  return styled(useStyles(styles))(
    <message className={className}>
      <IconOrImage icon="/icons/error_icon_sm.svg" />
      <message-body title={text}>
        {text}
      </message-body>
      <message-actions>
        {hasDetails && (
          <Button type='button' mod={['outlined']} onClick={onShowDetails}>
            {translate('ui_errors_details')}
          </Button>
        )}
      </message-actions>
    </message>
  );
});

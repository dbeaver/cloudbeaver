/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { Button } from './Button';

const styles = composes(
  css`
    message-body {
      composes: theme-text-error from global;
    }
  `,
  css`
    message {
      box-sizing: border-box;
      display: flex;
      align-items: center;
    }

    message-body {
      box-sizing: border-box;
      flex: 1;
      padding: 12px;
      word-break: break-word;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    message-actions {
      padding-left: 12px;
    }
  `
);

type ErrorMessageProps = {
  hasDetails?: boolean;
  text: string;
  className?: string;
  onShowDetails?(): void;
}

export const ErrorMessage = observer(function ErrorMessage({
  text,
  className,
  hasDetails,
  onShowDetails,
}: ErrorMessageProps) {
  const translate = useTranslate();

  return styled(useStyles(styles))(
    <message as="div" className={className}>
      <message-body title={text} as="div">
        {text}
      </message-body>
      <message-actions as="div">
        {hasDetails && (
          <Button type='button' mod={['outlined']} onClick={onShowDetails}>
            {translate('ui_errors_details')}
          </Button>
        )}
      </message-actions>
    </message>
  );
});

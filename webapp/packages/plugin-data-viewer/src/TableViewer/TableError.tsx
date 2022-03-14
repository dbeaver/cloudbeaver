/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { Button, IconOrImage, useErrorDetails, useObservableRef, useStateDelay } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ServerErrorType } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';

const style = css`
    error {
      composes: theme-background-surface theme-text-on-surface from global;
      position: absolute;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      padding: 16px;
      overflow: auto;
      pointer-events: none;
      bottom: 0;
      right: 0;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out, background 0.3s ease-in-out;

      &[|animated] {
        overflow: hidden;
        pointer-events: auto;
        opacity: 1;
      }
      &[|collapsed] {
        pointer-events: auto;
        width: 92px;
        height: 72px;
        background: transparent!important;

        & IconOrImage {
            cursor: pointer;
        }

        & error-message, & controls {
            display: none;
        }
      }
      &[|errorHidden] {
        pointer-events: none;
      }
    }
    error-body {
      display: flex;
      gap: 24px;
      align-items: center;
      margin-bottom: 24px;
    }
    error-message {
      white-space: pre-wrap;
    }
    IconOrImage {
      width: 40px;
      height: 40px;
    }
    controls {
      display: flex;
      gap: 16px;
      & > Button {
        flex-shrink: 0;
      }
    }
  `;

interface Props {
  model: IDatabaseDataModel;
  loading: boolean;
  className?: string;
}

interface ErrorInfo {
  error: Error | null;
  display: boolean;
  hide: () => void;
  show: () => void;
}

export const TableError = observer<Props>(function TableViewer({
  model,
  loading,
  className,
}) {
  const translate = useTranslate();
  const errorInfo = useObservableRef<ErrorInfo>(() => ({
    error: null,
    display: false,
    hide() {
      this.display = false;
    },
    show() {
      this.display = true;
    },
  }), {
    display: observable.ref,
  }, false);

  if (errorInfo.error !== model.source.error) {
    errorInfo.error = model.source.error || null;
    errorInfo.display = !!model.source.error;
  }

  const error = useErrorDetails(model.source.error || null);
  const animated = useStateDelay(!!errorInfo.error && !loading, 1);

  const errorHidden = errorInfo.error === null;
  const quote = error.details?.errorType === ServerErrorType.QUOTE_EXCEEDED;

  let icon = '/icons/error_icon.svg';

  if (quote) {
    icon = '/icons/info_icon.svg';
  }

  return styled(useStyles(style))(
    <error {...use({ animated, collapsed: !errorInfo.display, errorHidden })} className={className}>
      <error-body>
        <IconOrImage icon={icon} title={error.details?.message} onClick={() => errorInfo.show()} />
        <error-message>{error.details?.message}</error-message>
      </error-body>
      <controls>
        <Button type='button' mod={['outlined']} onClick={() => errorInfo.hide()}>
          {translate('ui_error_close')}
        </Button>
        {error.details?.hasDetails && (
          <Button type='button' mod={['outlined']} onClick={error.open}>
            {translate('ui_errors_details')}
          </Button>
        )}
        <Button type='button' mod={['unelevated']} onClick={() => model.retry()}>
          {translate('ui_processing_retry')}
        </Button>
      </controls>
    </error>
  );
});

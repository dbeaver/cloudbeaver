/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { Button, IconOrImage, s, useErrorDetails, useObservableRef, useS, useStateDelay, useTranslate } from '@cloudbeaver/core-blocks';
import { ServerErrorType, ServerInternalError } from '@cloudbeaver/core-sdk';
import { errorOf } from '@cloudbeaver/core-utils';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import styles from './TableError.module.css';

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

export const TableError = observer<Props>(function TableError({ model, loading, className }) {
  const translate = useTranslate();
  const style = useS(styles);
  const errorInfo = useObservableRef<ErrorInfo>(
    () => ({
      error: null,
      display: false,
      hide() {
        this.display = false;
      },
      show() {
        this.display = true;
      },
    }),
    {
      display: observable.ref,
    },
    false,
  );

  const internalServerError = errorOf(model.source.error, ServerInternalError);
  const error = useErrorDetails(model.source.error);
  const animated = useStateDelay(!!errorInfo.error && !loading, 1);

  const errorHidden = errorInfo.error === null;
  const quote = internalServerError?.errorType === ServerErrorType.QUOTE_EXCEEDED;

  let icon = '/icons/error_icon.svg';

  if (quote) {
    icon = '/icons/info_icon.svg';
  }

  let onRetry = () => model.retry();

  if (error.refresh) {
    const retry = onRetry;
    const refresh = error.refresh;
    onRetry = async () => {
      refresh();
      await retry();
    };
  }

  // keep it like this or remove error another way:
  // console goes with error that we cannot modify ref value in render method.
  useEffect(() => {
    if (errorInfo.error !== model.source.error) {
      errorInfo.error = model.source.error || null;
      errorInfo.display = !!model.source.error;
    }
  }, [errorInfo, model.source.error]);

  return (
    <div
      role="status"
      aria-label={error.message}
      tabIndex={0}
      className={s(style, { error: true, animated, collapsed: !errorInfo.display, errorHidden }, className)}
    >
      <div className={s(style, { errorBody: true })}>
        <IconOrImage className={s(style, { iconOrImage: true })} icon={icon} title={error.message} onClick={() => errorInfo.show()} />
        <div className={s(style, { errorMessage: true })}>{error.message}</div>
      </div>
      <div className={s(style, { controls: true })}>
        <Button className={s(style, { button: true })} type="button" variant="secondary" onClick={() => errorInfo.hide()}>
          {translate('ui_error_close')}
        </Button>
        {error.hasDetails && (
          <Button className={s(style, { button: true })} type="button" variant="secondary" onClick={error.open}>
            {translate('ui_errors_details')}
          </Button>
        )}
        <Button className={s(style, { button: true })} type="button" onClick={onRetry}>
          {translate('ui_processing_retry')}
        </Button>
      </div>
    </div>
  );
});

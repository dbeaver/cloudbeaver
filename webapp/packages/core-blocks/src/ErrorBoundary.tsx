/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React, { type ErrorInfo, Suspense } from 'react';

import { errorOf, LoadingError } from '@cloudbeaver/core-utils';

import { Button } from './Button.js';
import { DisplayError } from './DisplayError.js';
import style from './ErrorBoundary.module.css';
import { ErrorContext, type IExceptionContext } from './ErrorContext.js';
import { ExceptionMessage } from './ExceptionMessage.js';

interface Props {
  simple?: boolean;
  icon?: boolean;
  root?: boolean;
  inline?: boolean;
  remount?: boolean;
  className?: string;
  fallback?: React.ReactElement;
  onClose?: () => any;
  onRefresh?: () => any;
}

interface IErrorData {
  error: Error;
  errorInfo?: ErrorInfo;
}

interface IState {
  exceptions: IErrorData[];
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<Props>, IState> implements IExceptionContext {
  get canRefresh(): boolean {
    return !!this.props.remount || !!this.props.onRefresh || this.state.exceptions.some(error => errorOf(error.error, LoadingError));
  }
  constructor(props: Props) {
    super(props);

    this.state = { exceptions: [] };

    this.refresh = this.refresh.bind(this);
  }

  catch(exception: Error): void {
    this.componentDidCatch(exception);
  }

  override componentDidCatch(error: Error, errorInfo?: ErrorInfo): void {
    this.setState(state => {
      if (state.exceptions.some(data => data.error === error)) {
        return state;
      }
      return {
        exceptions: [
          ...state.exceptions,
          {
            error,
            errorInfo,
          },
        ],
      };
    });
  }

  override render(): React.ReactElement<any, any> | null {
    const { root, inline, icon, children, className, onClose } = this.props;

    for (const errorData of this.state.exceptions) {
      if (this.props.simple) {
        const stack = errorData.errorInfo?.componentStack || errorData.error.stack;
        return (
          <Suspense fallback={<>Loading...</>}>
            <div>
              <p>Something went wrong.</p>
              {onClose && (
                <div className={style['action']}>
                  <button type="button" onClick={onClose}>
                    Close
                  </button>
                </div>
              )}
              {this.canRefresh && (
                <div className={style['action']}>
                  <button type="button" onClick={this.refresh}>
                    Refresh
                  </button>
                </div>
              )}
              <div>
                {errorData.error.toString()}
                {stack && <br />}
                {stack}
              </div>
              {this.props.fallback}
            </div>
          </Suspense>
        );
      }

      if (root) {
        return (
          <Suspense fallback={<>Loading...</>}>
            <DisplayError className={className} root={root} error={errorData.error} errorInfo={errorData.errorInfo}>
              {onClose && (
                <div className={style['action']}>
                  <Button onClick={onClose}>Close</Button>
                </div>
              )}
              {this.canRefresh && (
                <div className={style['action']}>
                  <Button onClick={this.refresh}>Refresh</Button>
                </div>
              )}
            </DisplayError>
          </Suspense>
        );
      } else {
        return (
          <Suspense fallback={<>Loading...</>}>
            <ExceptionMessage
              inline={inline}
              icon={icon}
              className={className}
              exception={errorData.error}
              onRetry={this.canRefresh ? this.refresh : undefined}
              onClose={onClose}
            />
          </Suspense>
        );
      }
    }

    return (
      <ErrorContext.Provider value={this}>
        <Suspense fallback={<>Loading...</>}>{children}</Suspense>
      </ErrorContext.Provider>
    );
  }

  private refresh() {
    this.refreshExceptions();
    this.props.onRefresh?.();
    this.setState({ exceptions: [] });
  }

  private refreshExceptions() {
    for (const error of this.state.exceptions) {
      const loadingError = errorOf(error.error, LoadingError);
      if (loadingError) {
        loadingError.refresh();
      }
    }
  }
}

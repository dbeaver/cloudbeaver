/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React, { ErrorInfo } from 'react';

import { errorOf, LoadingError } from '@cloudbeaver/core-utils';

import { Button } from './Button';
import { DisplayError } from './DisplayError';
import style from './ErrorBoundary.m.css';
import { ErrorContext, IExceptionContext } from './ErrorContext';
import { ExceptionMessage } from './ExceptionMessage';

interface Props {
  icon?: boolean;
  root?: boolean;
  inline?: boolean;
  remount?: boolean;
  className?: string;
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

  componentDidCatch(error: Error, errorInfo?: ErrorInfo): void {
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

  render(): React.ReactNode {
    const { root, inline, icon, children, className, onClose } = this.props;

    for (const errorData of this.state.exceptions) {
      if (root) {
        return (
          <DisplayError className={className} root={root} error={errorData.error} errorInfo={errorData.errorInfo}>
            {onClose && (
              <div className={style.action}>
                <Button onClick={onClose}>Close</Button>
              </div>
            )}
            {this.canRefresh && (
              <div className={style.action}>
                <Button onClick={this.refresh}>Refresh</Button>
              </div>
            )}
          </DisplayError>
        );
      } else {
        return (
          <ExceptionMessage
            inline={inline}
            icon={icon}
            className={className}
            exception={errorData.error}
            onRetry={this.canRefresh ? this.refresh : undefined}
            onClose={onClose}
          />
        );
      }
    }

    return <ErrorContext.Provider value={this}>{children}</ErrorContext.Provider>;
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

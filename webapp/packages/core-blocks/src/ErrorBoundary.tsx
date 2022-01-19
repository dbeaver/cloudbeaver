/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React, { ErrorInfo } from 'react';
import styled, { css } from 'reshadow';

import { AppRefreshButton } from './AppRefreshButton';
import { Button } from './Button';
import { DisplayError } from './DisplayError';

const style = css`
  action, details {
    padding: 8px 16px;
  }
`;

interface IProps {
  onRefresh?: () => any;
  root?: boolean;
  remount?: boolean;
}

interface IState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
    };

    this.remount = this.remount.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render(): React.ReactNode {
    const { errorInfo, error } = this.state;
    const { remount, root, onRefresh } = this.props;

    if (errorInfo) {
      return styled(style)(
        <DisplayError root={root}>
          {root && <action><AppRefreshButton /></action>}
          {onRefresh && <action><Button onClick={this.refresh}>Refresh</Button></action>}
          {remount && <action><Button onClick={this.remount}>Refresh</Button></action>}
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {error?.toString() ?? ''}
            <br />
            {errorInfo.componentStack}
          </details>
        </DisplayError>
      );
    }

    return this.props.children;
  }

  private remount() {
    this.setState({
      error: null,
      errorInfo: null,
    });
  }

  private refresh() {
    this.props.onRefresh?.();
    this.remount();
  }
}

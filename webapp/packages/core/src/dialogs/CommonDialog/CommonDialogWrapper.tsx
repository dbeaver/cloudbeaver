/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

import { Icon } from '@dbeaver/core/blocks';
import { composes, useStyles } from '@dbeaver/core/theming';

export type CommonDialogWrapperProps = {
  title: string;
  onReject?: () => void;
  className?: string;
  noBodyPadding?: boolean;
  footer?: JSX.Element | boolean;
  header?: JSX.Element | boolean;
  children?: React.ReactNode;
}

const style = composes(
  css`
  dialog {
    composes: theme-background-surface theme-text-on-surface from global;
  }
  dialog-body {
    composes: theme-background-secondary theme-text-on-secondary from global;
  }
  `,
  css`
  dialog {
    composes: theme-elevation-z10 from global;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 0;
    margin: 0;
    border: none;
    min-width: 748px;
    max-height: 100%;
    border-radius: 0.25rem;
  }
  header {
    position: relative;
    display: flex;
    flex-direction: column;
  }
  header-title {
    display: flex;
    position: relative;
  }
  dialog-body {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
    padding: 18px 24px;
    min-height: 80px;
    max-width: 748px;
  }
  dialog-body[|noPadding] {
    padding: 0;
  }
  h1 {
    display: block;
    flex: 1;
    padding: 18px 24px;
    margin: 0;
    font-size: 20px;
    line-height: 28px;
    font-weight: normal;
  }
  reject {
    cursor: pointer;
    margin: 24px;
    width: 16px;
    height: 16px;
  }
  footer {
    composes: theme-elevation-z10 from global;
    z-index: 0;
    box-sizing: border-box;
    min-height: 72px;
    padding: 18px 24px;
  }
`
);

export function CommonDialogWrapper({
  title,
  header,
  footer,
  noBodyPadding,
  className,
  onReject,
  children,
}: CommonDialogWrapperProps) {

  return styled(useStyles(style))(
    <dialog className={className}>
      <header>
        <header-title as="div">
          <h1>{title}</h1>
          {onReject && (
            <reject as="div">
              <Icon name="cross" viewBox="0 0 16 16" onClick={onReject} />
            </reject>
          )}
        </header-title>
        {header}
      </header>
      <dialog-body as="div" {...use({ noPadding: noBodyPadding })}>{children}</dialog-body>
      <footer>
        {footer}
      </footer>
    </dialog>
  );
}

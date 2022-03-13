/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { IconButton } from '../../IconButton';

const SNACKBAR_WRAPPER_STYLES = css` 
  notification {
    composes: theme-background-surface theme-text-on-surface theme-elevation-z5 from global;
    position: relative;
    display: flex;
    box-sizing: border-box;
    overflow: hidden;
    width: 500px;
    margin-bottom: 16px;
    margin-left: 16px;
    padding: 16px 16px;
    line-height: 1.5;
    opacity: 0;
    border-radius: 4px;
    transition: opacity 0.3s ease-in-out, transform 0.5s ease-in-out;
    transform: translateX(-100%);

    &[use|mounted] {
      transform: translateX(0);
      opacity: 1;
    }
    &[use|closing] {
      opacity: 0;
    }
  }
  IconButton {
    position: absolute;
    top: 8px;
    right: 8px;
    height: 22px;
    width: 22px;
    &:hover {
      opacity: 0.7;
    }
  }`;

interface ISnackbarWrapperProps {
  closing?: boolean;
  unclosable?: boolean;
  onClose?: () => void;
  className?: string;
}

export const SnackbarWrapper: React.FC<ISnackbarWrapperProps> = function SnackbarWrapper({
  closing = false, unclosable, onClose, children, className,
}) {
  const styles = useStyles(SNACKBAR_WRAPPER_STYLES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return styled(styles)(
    <notification as="div" className={className} {...use({ mounted, closing })}>
      {children}
      {!unclosable && onClose && (
        <IconButton name="cross" viewBox="0 0 16 16" onClick={onClose} />
      )}
    </notification>
  );
};

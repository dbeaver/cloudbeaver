/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState, useEffect } from 'react';
import styled, { use } from 'reshadow';

import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { Button } from '../Button';
import { loaderStyles, overlayStyles } from './loaderStyles';

export type LoaderProps = {
  /** if false, nothing will be rendered, by default true */
  loading?: boolean;
  /** disable cancel button */
  cancelDisabled?: boolean;
  /** hides message */
  hideMessage?: boolean;
  /** render loader as overlay with white spinner */
  overlay?: boolean;
  /** loader with white spinner */
  secondary?: boolean;
  /** smallest spinner icon and hide loading message */
  small?: boolean;
  className?: string;
  onCancel?: () => void;
}

const spinnerType = {
  primary: '/icons/spinner-primary.svg',
  secondary: '/icons/spinner.svg',
};

export function Loader({
  cancelDisabled,
  overlay,
  hideMessage,
  secondary,
  small,
  className,
  loading = true,
  onCancel,
}: LoaderProps) {
  const style = useStyles(loaderStyles, overlay && overlayStyles);
  const [isVisible, setVisible] = useState(loading);
  const spinnerURL = (secondary || overlay) ? spinnerType.secondary : spinnerType.primary;

  useEffect(() => {
    if (!loading) {
      setVisible(loading);
      return;
    }

    const id = setTimeout(() => {
      setVisible(loading);
    }, 500);
    return () => clearTimeout(id);
  }, [loading]);

  if (!isVisible) {
    return null;
  }

  return styled(style)(
    <loader as="div" className={className} {...use({ small })}>
      <icon as="div"><img src={spinnerURL}/></icon>
      {!hideMessage && <message as="div"><Translate token='ui_processing_loading' /></message>}
      {onCancel && (
        <actions as='div'>
          <Button type="button" mod={['unelevated']}
            disabled={cancelDisabled}
            onClick={onCancel}><Translate token='ui_processing_cancel' /></Button>
        </actions>
      )}
    </loader>
  );
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';
import styled, { use } from 'reshadow';

import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { Button } from '../Button';
import { StaticImage } from '../StaticImage';
import { loaderStyles, overlayStyles } from './loaderStyles';

type LoaderState = {
  isLoading: () => boolean;
  isLoaded: () => boolean;
} | {
  loading: boolean;
};

interface Props {
  /** if false, nothing will be rendered, by default true */
  loading?: boolean;
  /** disable cancel button */
  cancelDisabled?: boolean;
  message?: string;
  /** hides message */
  hideMessage?: boolean;
  /** render loader as overlay with white spinner */
  overlay?: boolean;
  /** loader with white spinner */
  secondary?: boolean;
  /** smallest spinner icon and hide loading message */
  small?: boolean;
  className?: string;
  fullSize?: boolean;
  state?: LoaderState | LoaderState[];
  children?: () => React.ReactNode;
  onCancel?: () => void;
}

const spinnerType = {
  primary: '/icons/spinner-primary.svg',
  secondary: '/icons/spinner.svg',
};

export const Loader: React.FC<Props> = observer(function Loader({
  cancelDisabled,
  overlay,
  message,
  hideMessage,
  secondary,
  small,
  fullSize,
  className,
  loading = true,
  state,
  children,
  onCancel,
}) {
  let loaded = !loading;
  if (state) {
    state = Array.isArray(state) ? state : [state];

    for (const element of state) {
      if ('loading' in element) {
        loading = element.loading;
        loaded = !loading;
      } else {
        if ('isLoaded' in element) {
          loaded = element.isLoaded();
        }
        if ('isLoading' in element) {
          loading = element.isLoading();
        }
      }
    }
  }

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

  if (children) {
    if (loaded) {
      return <>{children()}</>;
    }

    if (!loading) {
      return null;
    }
  }

  if ((!isVisible && overlay) || !loading) {
    return null;
  }

  return styled(style)(
    <loader as="div" className={className} {...use({ small, fullSize })}>
      <icon as="div"><StaticImage icon={spinnerURL} /></icon>
      {!hideMessage && <message as="div"><Translate token={message || 'ui_processing_loading'} /></message>}
      {onCancel && (
        <actions as='div'>
          <Button
            type="button"
            mod={['unelevated']}
            disabled={cancelDisabled}
            onClick={onCancel}
          ><Translate token='ui_processing_cancel' />
          </Button>
        </actions>
      )}
    </loader>
  );
});

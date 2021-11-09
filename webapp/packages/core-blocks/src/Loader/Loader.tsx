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
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { Button } from '../Button';
import { ExceptionMessage } from '../ExceptionMessage';
import { StaticImage } from '../StaticImage';
import { loaderStyles, overlayStyles } from './loaderStyles';

export interface ILoadableState {
  isLoading: () => boolean;
  isLoaded: () => boolean;
  exception?: Error[] | Error | null;
  reload?: () => void;
}

type LoaderState = ILoadableState | {
  loading: boolean;
};

interface Props {
  /** if false, nothing will be rendered, by default true */
  loading?: boolean;
  inlineException?: boolean;
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
  inline?: boolean;
  loader?: boolean;
  className?: string;
  fullSize?: boolean;
  state?: LoaderState | LoaderState[];
  style?: ComponentStyle;
  children?: (() => React.ReactNode) | React.ReactNode;
  onCancel?: () => void;
}

const spinnerType = {
  primary: '/icons/spinner-primary.svg',
  secondary: '/icons/spinner.svg',
};

export const Loader = observer<Props>(function Loader({
  cancelDisabled,
  overlay,
  message,
  hideMessage,
  secondary,
  small,
  inline,
  fullSize,
  className,
  loader,
  loading = true,
  inlineException,
  state,
  style,
  children,
  onCancel,
}) {
  let exception: Error | null = null;
  let reload: (() => void) | undefined;

  let loaded = !loading;
  if (state) {
    state = Array.isArray(state) ? state : [state];

    for (const element of state) {
      if ('loading' in element) {
        loading = element.loading;
        loaded = !loading;
      } else {
        loaded = element.isLoaded();
        loading = element.isLoading();

        if ('exception' in element && element.exception) {
          if (Array.isArray(element.exception)) {
            const error = element.exception.find(Boolean);

            if (!error) {
              continue;
            }

            exception = error;
          } else {
            exception = element.exception;
          }

          if ('reload' in element) {
            reload = element.reload;
          }
        }
      }
    }
  }

  style = useStyles(loaderStyles, style, overlay && overlayStyles);
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

  if (exception && !loading) {
    return styled(style)(
      <ExceptionMessage exception={exception} inline={inline || inlineException} onRetry={reload} />
    );
  }

  if (children && (!loader || !loading)) {
    if (loaded) {
      if (typeof children === 'function') {
        return <>{children()}</>;
      } else {
        return <>{children}</>;
      }
    }

    if (!loading) {
      return null;
    }
  }

  if ((!isVisible && overlay) || !loading) {
    return null;
  }

  return styled(style)(
    <loader className={className} {...use({ small, fullSize, inline })}>
      <icon><StaticImage icon={spinnerURL} /></icon>
      {!hideMessage && <message><Translate token={message || 'ui_processing_loading'} /></message>}
      {onCancel && (
        <actions>
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

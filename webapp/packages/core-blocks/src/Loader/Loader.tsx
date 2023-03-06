/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useState, useEffect, useContext, useRef, Suspense } from 'react';
import styled, { use } from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { ILoadableState, uuid } from '@cloudbeaver/core-utils';

import { Button } from '../Button';
import { ExceptionMessage } from '../ExceptionMessage';
import { Translate } from '../localization/Translate';
import { StaticImage } from '../StaticImage';
import { useStyles } from '../useStyles';
import { ILoaderContext, LoaderContext } from './LoaderContext';
import { loaderStyles, overlayStyles } from './loaderStyles';

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
  /** hides error message */
  hideException?: boolean;
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
  primarySmall: '/icons/spinner-primary-small.svg',
  secondarySmall: '/icons/spinner-small.svg',
};

export const Loader = observer<Props>(function Loader({
  cancelDisabled,
  overlay,
  message,
  hideMessage,
  hideException,
  secondary,
  small,
  inline,
  fullSize,
  className,
  loader,
  loading,
  inlineException,
  state,
  style,
  children,
  onCancel,
}) {
  const context = useContext(LoaderContext);
  const [loaderId] = useState(() => uuid());
  const [contextState] = useState<ILoaderContext>(() => ({ state: observable(new Set<string>()) }));
  const loaderRef = useRef<HTMLDivElement>(null);

  let exception: Error | null = null;
  let reload: (() => void) | undefined;

  const loadingUndefined = loading === undefined;

  if (loadingUndefined) {
    loading = true;
  }

  let loaded = !loading;

  if (state) {
    state = Array.isArray(state) ? state : [state];

    for (let i = 0; i < state.length; i++) {
      const element = state[i];

      if (
        'isLoaded' in element
        && 'isLoading' in element
      ) {

        if (i === 0 && loadingUndefined) {
          loaded = element.isLoaded();
          loading = element.isLoading();
        } else {
          loaded &&= element.isLoaded();
          loading ||= element.isLoading();
        }

        if (loading) {
          if (element.cancel) {
            const cancelCopy = onCancel;
            onCancel = () => {
              cancelCopy?.();
              element.cancel?.();
            };
          }

          if (element.isCancelled) {
            if (i == 0 && cancelDisabled === undefined) {
              cancelDisabled = element.isCancelled();
            } else {
              cancelDisabled ||= element.isCancelled();
            }
          }
        }
      } else {
        if (i === 0 && loadingUndefined) {
          loading = element.loading;
          loaded = !loading;
        } else {
          loading ||= element.loading;
          loaded &&= !loading;
        }
      }

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

  style = useStyles(loaderStyles, style, overlay && overlayStyles);
  const [isVisible, setVisible] = useState(loading);

  const refLoaderDisplayed = { state: false };

  useEffect(() => {
    if (!loading) {
      setVisible(loading);
      return;
    }

    const id = setTimeout(() => {
      setVisible(loading);
    }, 500);

    return () => {
      clearTimeout(id);
    };
  }, [loading]);

  useEffect(() => {
    if (context) {
      if (refLoaderDisplayed.state) {
        context.state.add(loaderId);
      } else {
        context.state.delete(loaderId);
      }
    }
  });

  useEffect(() => () => {
    if (context) {
      context.state.delete(loaderId);
    }
  }, []);

  useEffect(() => {
    if (loaderRef.current) {
      loaderRef.current.classList.add('animate');
    }
  });

  if (exception && !loading && !hideException) {
    return styled(style)(
      <ExceptionMessage
        exception={exception}
        inline={inline || inlineException}
        className={className}
        onRetry={reload}
      />
    );
  }

  if (children && (!loader || !loading) && !overlay) {
    if (loaded) {
      return (
        <LoaderContext.Provider value={contextState}>
          <Suspense fallback={<Loader className={className} />}>
            {typeof children === 'function' ? children() : children}
          </Suspense>
        </LoaderContext.Provider>
      );
    }

    if (!loading) {
      return null;
    }
  }

  if ((!isVisible && overlay) || !loading) {
    if (overlay) {
      return (
        <LoaderContext.Provider value={contextState}>
          <Suspense fallback={<Loader className={className} />}>
            {typeof children === 'function' ? children() : children}
          </Suspense>
        </LoaderContext.Provider>
      );
    }

    return null;
  }

  refLoaderDisplayed.state = true;

  let spinnerURL: string;

  if (secondary || overlay) {
    spinnerURL = small ? spinnerType.secondarySmall : spinnerType.secondary;
  } else {
    spinnerURL = small ? spinnerType.primarySmall : spinnerType.primary;
  }

  return styled(style)(
    <LoaderContext.Provider value={contextState}>
      <>
        {overlay && (
          <Suspense fallback={<Loader className={className} />}>
            {typeof children === 'function' ? children() : children}
          </Suspense>
        )}
        <loader ref={loaderRef} className={className} {...use({ small, fullSize, inline, secondary, overlay })}>
          <icon>
            <StaticImage icon={spinnerType.primary} {...use({ primaryIcon: true })} />
            <StaticImage icon={spinnerType.primarySmall} {...use({ primarySmallIcon: true })} />
            <StaticImage icon={spinnerType.secondary} {...use({ secondaryIcon: true })} />
            <StaticImage icon={spinnerType.secondarySmall} {...use({ secondarySmallIcon: true })} />
          </icon>
          {!hideMessage && <message><Translate token={message || 'ui_processing_loading'} /></message>}
          {onCancel && (
            <actions>
              <Button
                type="button"
                mod={['unelevated']}
                disabled={cancelDisabled}
                onClick={onCancel}
              >
                <Translate token='ui_processing_cancel' />
              </Button>
            </actions>
          )}
        </loader>
      </>
    </LoaderContext.Provider>
  );
});

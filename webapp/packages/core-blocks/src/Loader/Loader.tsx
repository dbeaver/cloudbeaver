/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Suspense, useContext, useEffect, useRef, useState } from 'react';

import { type ILoadableState, uuid } from '@cloudbeaver/core-utils';

import { Button } from '../Button.js';
import { ErrorBoundary } from '../ErrorBoundary.js';
import { ExceptionMessage } from '../ExceptionMessage.js';
import { Translate } from '../localization/Translate.js';
import { s } from '../s.js';
import { StaticImage } from '../StaticImage.js';
import { useS } from '../useS.js';
import styles from './Loader.module.css';
import { type ILoaderContext, LoaderContext } from './LoaderContext.js';

type LoaderState =
  | ILoadableState
  | {
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
  /** render loader as suspense */
  suspense?: boolean;
  /** loader with white spinner */
  secondary?: boolean;
  /** smallest spinner icon and hide loading message */
  small?: boolean;
  inline?: boolean;
  loader?: boolean;
  className?: string;
  fullSize?: boolean;
  state?: LoaderState | LoaderState[];
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
  suspense,
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
      const element = state[i]!;

      if ('isLoaded' in element && 'isLoading' in element) {
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
          const reloadLink = element.reload;
          const reloadCopy = reload;
          reload = () => {
            reloadCopy?.();
            reloadLink?.();
          };
        }
      }
    }
  }

  if (suspense) {
    loading = false;
  }

  const style = useS(styles);
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

  useEffect(
    () => () => {
      if (context) {
        context.state.delete(loaderId);
      }
    },
    [],
  );

  useEffect(() => {
    if (loaderRef.current) {
      loaderRef.current.classList.add('animate');
    }
  });

  function renderWrappedChildren() {
    return (
      <LoaderContext.Provider value={contextState}>
        <ErrorBoundary icon={small} inline={inline} remount>
          <Suspense
            fallback={
              <Loader
                message={message}
                hideMessage={hideMessage}
                hideException={hideException}
                secondary={secondary}
                small={small}
                inline={inline}
                fullSize={fullSize}
                overlay={overlay}
                className={className}
                inlineException={inlineException}
              />
            }
          >
            {typeof children === 'function' ? children() : children}
          </Suspense>
        </ErrorBoundary>
      </LoaderContext.Provider>
    );
  }

  if (suspense) {
    return renderWrappedChildren();
  }

  if (exception && !loading) {
    if (hideException) {
      return null;
    }
    return <ExceptionMessage exception={exception} inline={inline || inlineException} className={className} onRetry={reload} />;
  }

  if (children && (!loader || !loading) && !overlay) {
    if (loaded) {
      return renderWrappedChildren();
    }

    if (!loading) {
      return null;
    }
  }

  if ((!isVisible && overlay) || !loading) {
    if (overlay) {
      return renderWrappedChildren();
    }

    return null;
  }

  refLoaderDisplayed.state = true;

  return (
    <LoaderContext.Provider value={contextState}>
      <>
        {overlay && renderWrappedChildren()}
        <div ref={loaderRef} className={s(style, { loader: true, loaderOverlay: overlay, small, fullSize, inline, secondary, overlay }, className)}>
          <div className={s(style, { icon: true })}>
            <StaticImage icon={spinnerType.primary} className={s(style, { staticImage: true, primaryIcon: true })} />
            <StaticImage icon={spinnerType.primarySmall} className={s(style, { staticImage: true, primarySmallIcon: true })} />
            <StaticImage icon={spinnerType.secondary} className={s(style, { staticImage: true, secondaryIcon: true })} />
            <StaticImage icon={spinnerType.secondarySmall} className={s(style, { staticImage: true, secondarySmallIcon: true })} />
          </div>
          {!hideMessage && (
            <div className={s(style, { message: true })}>
              <Translate token={message || 'ui_processing_loading'} />
            </div>
          )}
          {onCancel && (
            <div className={s(style, { actions: true })}>
              <Button type="button" disabled={cancelDisabled} onClick={onCancel}>
                <Translate token="ui_processing_cancel" />
              </Button>
            </div>
          )}
        </div>
      </>
    </LoaderContext.Provider>
  );
});

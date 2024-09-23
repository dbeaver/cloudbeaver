/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Compartment, StateEffect } from '@codemirror/state';
import { showPanel } from '@codemirror/view';
import { observer } from 'mobx-react-lite';
import { useContext, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

import { ReactCodemirrorContext } from './ReactCodemirrorContext.js';

interface Props extends React.PropsWithChildren {
  className?: string;
  incomingView?: boolean;
  top?: boolean;
}

export const ReactCodemirrorPanel: React.FC<Props> = observer(function ReactCodemirrorPanel({ className, children, incomingView, top }) {
  const dom = useMemo(() => document.createElement('div'), []);
  const compartment = useMemo(() => new Compartment(), []);
  const context = useContext(ReactCodemirrorContext);

  const view = incomingView ? context?.incomingView : context?.view;
  useLayoutEffect(() => {
    if (view) {
      view.dispatch({
        effects: [StateEffect.appendConfig.of(compartment.of(showPanel.of(() => ({ top, dom }))))],
      });

      return () => {
        view.dispatch({
          effects: compartment.reconfigure([]),
        });
      };
    }

    return undefined;
  }, [view, top]);

  useLayoutEffect(() => {
    if (className) {
      const classes = className.split(' ');
      dom.classList.add(...classes);

      return () => {
        dom.classList.remove(...classes);
      };
    }
    return undefined;
  }, [className]);

  return createPortal(children, dom) as any;
});

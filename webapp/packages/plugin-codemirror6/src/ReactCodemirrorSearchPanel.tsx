/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Compartment, EditorState, StateEffect } from '@codemirror/state';
import { getSearchQuery, search, SearchQuery } from '@codemirror/search';
import { observer } from 'mobx-react-lite';
import { useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ReactCodemirrorContext } from './ReactCodemirrorContext.js';
import { SearchPanel } from './SearchPanel/SearchPanel.js';

interface Props extends React.PropsWithChildren {
  className?: string;
  incomingView?: boolean;
  top?: boolean;
}

function getSearchMatchesCount(state: EditorState, config?: SearchQuery) {
  const searchQuery = new SearchQuery(config ?? getSearchQuery(state));

  const cursor = searchQuery.getCursor(state);
  const counter = { count: 0, current: 1 };

  const { from, to } = state.selection.main;

  let item = cursor.next();
  while (!item.done) {
    if (item.value.from === from && item.value.to === to) {
      counter.current = counter.count + 1;
    }

    item = cursor.next();
    counter.count++;
  }

  return counter;
}

export const ReactCodemirrorSearchPanel: React.FC<Props> = observer(function ReactCodemirrorSearchPanel({ className, incomingView, top }) {
  const dom = useMemo(() => document.createElement('div'), []);
  const compartment = useMemo(() => new Compartment(), []);
  const context = useContext(ReactCodemirrorContext);
  const view = incomingView ? context?.incomingView : context?.view;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchMatchesCount, setSearchMatchesCount] = useState({ count: 0, current: 1 });
  const [queryState, setQueryState] = useState<SearchQuery>(view ? getSearchQuery(view?.state) : new SearchQuery({ search: '' }));

  useLayoutEffect(() => {
    if (view) {
      view.dispatch({
        effects: [
          StateEffect.appendConfig.of(
            compartment.of(
              search({
                createPanel: () => ({
                  dom,
                  top,
                  update(update) {
                    const searchQuery = getSearchQuery(update.state);
                    setQueryState(searchQuery);
                    setSearchMatchesCount(getSearchMatchesCount(update.state, searchQuery));
                  },
                  mount: () => {
                    searchInputRef.current?.focus();
                  },
                }),
              }),
            ),
          ),
        ],
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

  if (!view) {
    return null;
  }

  return createPortal(
    <SearchPanel inputRef={searchInputRef} queryState={queryState} view={view} searchMatchesCount={searchMatchesCount} />,
    dom,
  ) as any;
});

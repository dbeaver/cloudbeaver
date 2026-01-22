/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Decoration, type DecorationSet, EditorView, StateEffect, StateField } from '@cloudbeaver/plugin-codemirror6';

const ACTIVE_QUERY_EFFECT_ADD = StateEffect.define<{ from: number; to: number | undefined }>({
  map: (val, mapping) => ({
    from: mapping.mapPos(val.from),
    to: val.to === undefined ? undefined : mapping.mapPos(val.to),
  }),
});

const ACTIVE_QUERY_EFFECT_CLEAR = StateEffect.define();

const ACTIVE_QUERY_DECORATION = Decoration.mark({
  class: 'active-query',
});

export const ACTIVE_QUERY_EXTENSION: StateField<DecorationSet> = StateField.define({
  create() {
    return Decoration.none;
  },
  update(value, transaction) {
    value = value.map(transaction.changes);

    for (const effect of transaction.effects) {
      if (effect.is(ACTIVE_QUERY_EFFECT_ADD)) {
        if (effect.value.from === effect.value.to) {
          return value;
        }

        value = value.update({
          add: [ACTIVE_QUERY_DECORATION.range(effect.value.from, effect.value.to)],
        });
      }

      if (effect.is(ACTIVE_QUERY_EFFECT_CLEAR)) {
        value = value.update({
          filter: () => false,
        });
      }
    }

    return value;
  },
  provide: f => EditorView.decorations.from(f),
});

export function highlightActiveQuery(view: EditorView, from: number, to: number | undefined) {
  view.dispatch({
    effects: ACTIVE_QUERY_EFFECT_ADD.of({ from, to }),
  });
}

export function clearActiveQueryHighlight(view: EditorView) {
  view.dispatch({
    effects: ACTIVE_QUERY_EFFECT_CLEAR.of(null),
  });
}

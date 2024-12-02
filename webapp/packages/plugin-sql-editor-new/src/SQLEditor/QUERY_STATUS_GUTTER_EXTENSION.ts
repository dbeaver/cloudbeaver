/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type EditorView, gutter, GutterMarker, RangeSet, StateEffect, StateField } from '@cloudbeaver/plugin-codemirror6';

type QueryGutterEffectType = 'run' | 'error';

const QUERY_STATUS_SIZE_MARKER = new (class extends GutterMarker {})();

const RUN_QUERY_MARKER = new (class extends GutterMarker {
  override toDOM(): Node {
    const span = document.createElement('div');
    span.className = 'running-query-line';
    return span;
  }
})();

const ERROR_QUERY_MARKER = new (class extends GutterMarker {
  override toDOM(): Node {
    const span = document.createElement('div');
    span.className = 'running-query-error-line';
    return span;
  }
})();

const QUERY_GUTTER_EFFECT = StateEffect.define<{ pos: number; on: boolean; type: QueryGutterEffectType }>({
  map: (val, mapping) => ({ pos: mapping.mapPos(val.pos), on: val.on, type: val.type }),
});

const gutterExtension = StateField.define<RangeSet<GutterMarker>>({
  create() {
    return RangeSet.empty;
  },
  update(set, transaction) {
    set = set.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (effect.is(QUERY_GUTTER_EFFECT)) {
        if (effect.value.on) {
          const markers = [];

          if (effect.value.type === 'run') {
            markers.push(RUN_QUERY_MARKER.range(effect.value.pos));
          }

          if (effect.value.type === 'error') {
            markers.push(ERROR_QUERY_MARKER.range(effect.value.pos));
          }

          set = set.update({ add: markers });
        } else {
          set = set.update({ filter: () => false });
        }
      }
    }

    return set;
  },
});

export function setGutter(view: EditorView, pos: number, type: QueryGutterEffectType, value: boolean) {
  view.dispatch({
    effects: QUERY_GUTTER_EFFECT.of({ pos, on: value, type }),
  });
}

export const QUERY_STATUS_GUTTER_EXTENSION = [
  gutterExtension,
  gutter({
    class: 'query-status',
    markers: view => view.state.field(gutterExtension),
    initialSpacer: () => QUERY_STATUS_SIZE_MARKER,
  }),
];

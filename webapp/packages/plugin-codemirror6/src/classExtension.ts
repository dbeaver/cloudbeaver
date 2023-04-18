/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { StateField, StateEffect } from '@codemirror/state';
import { EditorView, Decoration } from '@codemirror/view';

export const classEffect = StateEffect.define<any>();
export const clearClassesEffect = StateEffect.define();

export const classExtension = StateField.define({
  create() {
    return Decoration.none;
  },
  update(value, transaction) {
    value = value.map(transaction.changes);

    for (const effect of transaction.effects) {
      if (effect.is(clearClassesEffect)) {
        value = value.update({
          filter: () => false,
        });
      }

      if (effect.is(classEffect)) {
        value = value.update({
          add: effect.value,
        });
      }
    }

    return value;
  },
  provide: f => EditorView.decorations.from(f),
});
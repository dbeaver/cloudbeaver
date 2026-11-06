/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ISqlEditorModel } from './ISqlEditorModel.js';

export function requestSqlEditorFocus(model: ISqlEditorModel, canFocus: () => boolean = () => true, getFocusTarget?: () => Element | null): void {
  const origin = document.activeElement;
  const ownerDocument = origin?.ownerDocument ?? document;
  model.requestFocus(() => {
    const activeElement = ownerDocument.activeElement;
    const target = getFocusTarget?.();

    return (
      canFocus() &&
      (activeElement === origin || (!origin?.isConnected && activeElement === ownerDocument.body) || (!!target && activeElement === target))
    );
  });
}

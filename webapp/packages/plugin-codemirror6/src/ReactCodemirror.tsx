/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EditorView } from 'codemirror6';
import { useEffect, useState } from 'react';

import type { IReactCodeMirrorProps } from './IReactCodemirrorProps';

export const ReactCodemirror: React.FC<IReactCodeMirrorProps> = function ReactCodemirror({
  value,
}) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    let view: EditorView | undefined;

    if (ref) {
      view = new EditorView({
        parent: ref,
        doc: value,
      });
    }

    return () => {
      view?.destroy();
    };
  }, [ref]);

  return (
    <div ref={setRef} />
  );
};
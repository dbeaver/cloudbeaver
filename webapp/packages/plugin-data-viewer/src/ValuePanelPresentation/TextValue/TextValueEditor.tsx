/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { EditorLoader, useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';

import { useDataViewerCopyHandler } from '../../useDataViewerCopyHandler.js';
import { getTypeExtension } from './getTypeExtension.js';

interface Props {
  contentType: string;
  readonly: boolean;
  lineWrapping: boolean;
  valueGetter: () => string;
  onChange: (value: string) => void;
}

export const TextValueEditor = observer<Props>(function TextValueEditor({ contentType, valueGetter, readonly, lineWrapping, onChange }) {
  const value = valueGetter();
  const typeExtension = useMemo(() => getTypeExtension(contentType!) ?? [], [contentType]);

  const extensions = useCodemirrorExtensions(undefined, typeExtension);
  const copyEventHandler = useDataViewerCopyHandler();

  return (
    <EditorLoader
      value={value}
      lineWrapping={lineWrapping}
      readonly={readonly}
      extensions={extensions}
      copyEventHandler={copyEventHandler}
      onChange={onChange}
    />
  );
});

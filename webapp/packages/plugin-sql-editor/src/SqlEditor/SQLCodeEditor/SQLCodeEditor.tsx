/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect, useImperativeHandle } from 'react';

import { useController } from '@cloudbeaver/core-di';
import { CodeEditorLoader } from '@cloudbeaver/plugin-codemirror';

import type { ISQLCodeEditorProps } from './ISQLCodeEditorProps';
import { SQLCodeEditorController } from './SQLCodeEditorController';

export const SQLCodeEditor = observer<ISQLCodeEditorProps, SQLCodeEditorController>(function SQLCodeEditor(props, ref) {
  const controller = useController(SQLCodeEditorController, props.bindings);
  controller.setDialect(props.dialect);

  useEffect(() => {
    controller.setBindings(props.bindings);
  }, [controller, props.bindings]);

  useImperativeHandle(ref, () => controller, [controller]);

  return (
    <CodeEditorLoader
      {...controller.bindings}
      className={props.className}
      readonly={props.readonly}
      value={props.value || ''}
    />
  );
}, { forwardRef: true });

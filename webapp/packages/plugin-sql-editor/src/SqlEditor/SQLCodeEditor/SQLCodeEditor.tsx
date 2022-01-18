/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useImperativeHandle, useMemo } from 'react';

import { useController } from '@cloudbeaver/core-di';
import { CodeEditorLoader } from '@cloudbeaver/plugin-codemirror';

import type { ISQLCodeEditorProps } from './ISQLCodeEditorProps';
import { SQLCodeEditorController } from './SQLCodeEditorController';

export const SQLCodeEditor = observer<ISQLCodeEditorProps, SQLCodeEditorController>(function SQLCodeEditor(props, ref) {
  const controller = useController(SQLCodeEditorController);
  controller.setDialect(props.dialect);
  controller.setReadonly(props.readonly || false);

  useMemo(() => {
    controller.setBindings(props.bindings);
  }, [controller, props.bindings]);

  useImperativeHandle(ref, () => controller, [controller]);

  return (
    <CodeEditorLoader
      {...controller.bindings}
      options={{
        ...controller.bindings.options,
        mode: controller.mode,
      }}
      className={props.className}
      readonly={props.readonly}
      autoFormat={props.autoFormat}
      value={props.value || ''}
    />
  );
}, { forwardRef: true });

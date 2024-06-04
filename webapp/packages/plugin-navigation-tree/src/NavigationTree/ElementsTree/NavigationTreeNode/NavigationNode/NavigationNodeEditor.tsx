/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { s, useS } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { InlineEditor } from '@cloudbeaver/core-ui';

import style from './NavigationNodeEditor.module.css';

export interface NavigationNodeEditorProps {
  name: string;
  disabled?: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

export const NavigationNodeEditor = observer<NavigationNodeEditorProps>(function NavigationNodeEditor({
  name: initialName,
  disabled,
  onSave,
  onClose,
}) {
  const styles = useS(style);
  const [name, setName] = useState(initialName);
  const isNameChanged = initialName !== name;
  const isDisabledSave = disabled || !isNameChanged;

  function save() {
    onSave(name);
  }

  function stopPropagation(event: React.MouseEvent<HTMLDivElement>) {
    EventContext.set(event, EventStopPropagationFlag);
  }

  return (
    <InlineEditor
      value={name}
      disabled={disabled}
      disableSave={isDisabledSave}
      controlsPosition="inside"
      className={s(styles, { inlineEditor: true })}
      simple
      autofocus
      onChange={setName}
      onSave={save}
      onDoubleClick={stopPropagation}
      onReject={onClose}
      onBlur={onClose}
      onClick={stopPropagation}
    />
  );
});

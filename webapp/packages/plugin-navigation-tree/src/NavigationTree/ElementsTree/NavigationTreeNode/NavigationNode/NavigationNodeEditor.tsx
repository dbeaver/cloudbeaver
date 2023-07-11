/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { InlineEditor } from '@cloudbeaver/core-ui';

const styles = css`
  InlineEditor {
    height: 22px;

    & input,
    & input[disabled],
    & input[readonly] {
      padding: 1px;
    }
  }
`;

interface Props {
  name: string;
  disabled?: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

export const NavigationNodeEditor = observer<Props>(function NavigationNodeEditor({ name: initialName, disabled, onSave, onClose }) {
  const [name, setName] = useState(initialName);

  function save() {
    onSave(name);
  }

  function stopPropagation(event: React.MouseEvent<HTMLDivElement>) {
    EventContext.set(event, EventStopPropagationFlag);
  }

  return styled(styles)(
    <InlineEditor
      value={name}
      disabled={disabled}
      controlsPosition="inside"
      style={styles}
      simple
      autofocus
      onChange={setName}
      onSave={save}
      onDoubleClick={stopPropagation}
      onReject={onClose}
      onBlur={onClose}
      onClick={stopPropagation}
    />,
  );
});

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

import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag, NotificationService } from '@cloudbeaver/core-events';
import { type NavNode, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { InlineEditor } from '@cloudbeaver/core-ui';

const styles = css`
  InlineEditor {
    height: 22px;

    & input {
      padding: 1px;
    }
  }
`;

interface Props {
  node: NavNode;
  onClose: () => void;
}

export const NavigationNodeEditor = observer<Props>(function NavigationNodeEditor({ node, onClose }) {
  const navTreeResource = useService(NavTreeResource);
  const notificationService = useService(NotificationService);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(node.name || '');

  async function save() {
    if (loading) {
      return;
    }

    try {
      if (node.name !== name && name.trim().length) {
        setLoading(true);
        await navTreeResource.changeName(node, name);
      }
    } catch (exception: any) {
      notificationService.logException(exception, 'app_navigationTree_node_change_name_error');
    } finally {
      setLoading(false);
      onClose();
    }
  }

  function stopPropagation(event: React.MouseEvent<HTMLDivElement>) {
    EventContext.set(event, EventStopPropagationFlag);
  }

  return styled(styles)(
    <InlineEditor
      value={name}
      disabled={loading}
      controlsPosition='inside'
      style={styles}
      simple
      autofocus
      onChange={setName}
      onSave={save}
      onDoubleClick={stopPropagation}
      onReject={onClose}
      // onBlur={onClose}
      onClick={stopPropagation}
    />
  );
});

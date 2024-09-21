/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { ISynchronizationMessage } from '@cloudbeaver/core-root';
import { uniq } from '@cloudbeaver/core-utils';

import styles from './DataSynchronizationNotificationMessages.module.css';

type DataSynchronizationNotificationMessagesProps = {
  messages: ISynchronizationMessage[];
};

export const DataSynchronizationNotificationMessages = observer<DataSynchronizationNotificationMessagesProps>(
  function DataSynchronizationNotificationMessages({ messages }) {
    const translate = useTranslate();
    const message = uniq(messages.map(m => translate(m.message))).join('\n');
    const style = useS(styles);

    return (
      <div key={messages[0]!.label} className={s(style, { messageContent: true })}>
        {message}
      </div>
    );
  },
);

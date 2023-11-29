import { s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { ISynchronizationMessage } from '@cloudbeaver/core-root';
import { uniq } from '@cloudbeaver/core-utils';
import { observer } from 'mobx-react-lite';
import styles from './DataSynchronizationNotificationMessages.m.css';

type DataSynchronizationNotificationMessagesProps = {
  messages: ISynchronizationMessage[];
};

export const DataSynchronizationNotificationMessages = observer<DataSynchronizationNotificationMessagesProps>(function DataSynchronizationNotificationMessages({ messages }) {
  const translate = useTranslate();
  const message = uniq(messages.map(m => translate(m.message))).join('\n');
  const style = useS(styles);

  return <div key={messages[0].label} className={s(style, { messageContent: true })}>{message}</div>;
});
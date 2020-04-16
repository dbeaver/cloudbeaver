/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useTabHandler } from './useTabHandler';

type HandlerPanelProps = {
  tabId: string;
  handlerId: string;
  className?: string;
}

export const HandlerData = observer(function HandlerData({
  tabId,
  handlerId,
}: HandlerPanelProps) {
  const handler = useTabHandler(handlerId);
  const TabHandler = handler.getHandler();

  return (
    <TabHandler tabId={tabId} handlerId={handlerId} />
  );
});

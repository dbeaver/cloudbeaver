/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { TabIcon, TabTitle } from '@dbeaver/core/blocks';

import { useTabHandler } from './useTabHandler';

type HandlerContentProps = {
  handlerId: string;
}

export const HandlerContent = observer(function HandlerContent({
  handlerId,
}: HandlerContentProps) {
  const handler = useTabHandler(handlerId);

  return (
    <>
      <TabIcon icon={handler.icon}/>
      <TabTitle title={handler.name}/>
    </>
  );
});

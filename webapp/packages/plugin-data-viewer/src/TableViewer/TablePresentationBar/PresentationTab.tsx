/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useTranslate } from '@cloudbeaver/core-blocks';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import type { IDataPresentationOptions } from '../../DataPresentationService.js';

interface Props {
  model: IDatabaseDataModel;
  resultIndex: number;
  presentation: IDataPresentationOptions;
  className?: string;
  onClick: (tabId: string) => void;
}

export const PresentationTab = observer<Props>(function PresentationTab({ model, presentation, className, onClick }) {
  const translate = useTranslate();

  if (presentation.getTabComponent) {
    const Tab = presentation.getTabComponent();

    return (
      <Tab tabId={presentation.id} className={className} model={model} presentation={presentation} disabled={model.isLoading()} onClick={onClick} />
    );
  }

  return (
    <Tab tabId={presentation.id} disabled={model.isLoading()} onClick={onClick}>
      {presentation.icon && <TabIcon icon={presentation.icon} />}
      {presentation.title && <TabTitle>{translate(presentation.title)}</TabTitle>}
    </Tab>
  );
});

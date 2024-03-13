/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { SContext, StyleRegistry, useTranslate } from '@cloudbeaver/core-blocks';
import { Tab, TabIcon, TabIconStyles, TabStyles, TabTitle, TabTitleStyles, TabVerticalRotatedStyles } from '@cloudbeaver/core-ui';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDataPresentationOptions } from '../../DataPresentationService';

interface Props {
  model: IDatabaseDataModel;
  resultIndex: number;
  presentation: IDataPresentationOptions;
  className?: string;
  onClick: (tabId: string) => void;
}

const presentationTabRegistry: StyleRegistry = [
  [
    TabStyles,
    {
      mode: 'append',
      styles: [TabVerticalRotatedStyles],
    },
  ],
  [
    TabIconStyles,
    {
      mode: 'append',
      styles: [TabVerticalRotatedStyles],
    },
  ],
  [
    TabTitleStyles,
    {
      mode: 'append',
      styles: [TabVerticalRotatedStyles],
    },
  ],
];

export const PresentationTab = observer<Props>(function PresentationTab({ model, presentation, className, onClick }) {
  const translate = useTranslate();

  if (presentation.getTabComponent) {
    const Tab = presentation.getTabComponent();

    return (
      <SContext registry={presentationTabRegistry}>
        <Tab tabId={presentation.id} className={className} model={model} presentation={presentation} disabled={model.isLoading()} onClick={onClick} />
      </SContext>
    );
  }

  return (
    <SContext registry={presentationTabRegistry}>
      <Tab tabId={presentation.id} disabled={model.isLoading()} onClick={onClick}>
        {presentation.icon && <TabIcon icon={presentation.icon} />}
        {presentation.title && <TabTitle>{translate(presentation.title)}</TabTitle>}
      </Tab>
    </SContext>
  );
});

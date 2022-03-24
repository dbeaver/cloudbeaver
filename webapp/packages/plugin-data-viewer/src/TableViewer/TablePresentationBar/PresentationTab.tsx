/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';
import {
  VERTICAL_ROTATED_TAB_STYLES, Tab, TabIcon, TabTitle, BASE_TAB_STYLES
} from '@cloudbeaver/core-ui';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDataPresentationOptions } from '../../DataPresentationService';

interface Props {
  model: IDatabaseDataModel;
  resultIndex: number;
  presentation: IDataPresentationOptions;
  className?: string;
  style?: ComponentStyle;
  onClick: (tabId: string) => void;
}

export const PresentationTab = observer<Props>(function PresentationTab({
  model,
  presentation,
  className,
  style,
  onClick,
}) {
  const translate = useTranslate();
  const styles = useStyles(BASE_TAB_STYLES, VERTICAL_ROTATED_TAB_STYLES, style);

  if (presentation.getTabComponent) {
    const Tab = presentation.getTabComponent();

    return (
      <Tab
        tabId={presentation.id}
        className={className}
        style={[BASE_TAB_STYLES, VERTICAL_ROTATED_TAB_STYLES]}
        model={model}
        presentation={presentation}
        disabled={model.isLoading()}
        onClick={onClick}
      />
    );
  }

  return styled(styles)(
    <Tab
      tabId={presentation.id}
      style={[BASE_TAB_STYLES, VERTICAL_ROTATED_TAB_STYLES, style]}
      disabled={model.isLoading()}
      onClick={onClick}
    >
      {presentation.icon && <TabIcon icon={presentation.icon} />}
      {presentation.title && <TabTitle>{translate(presentation.title)}</TabTitle>}
    </Tab>
  );
});

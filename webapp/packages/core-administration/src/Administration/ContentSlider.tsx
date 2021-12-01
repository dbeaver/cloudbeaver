/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { SlideBox, SlideElement, slideBoxStyles, SlideOverlay, ErrorBoundary } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import type { IAdministrationItemRoute } from '../AdministrationItem/IAdministrationItemRoute';
import { ItemContent } from './ItemContent';

const styles = css`
  SlideBox {
    flex: 1;
  }
  SlideElement {
    flex: 1;
  }
  content {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
    white-space: normal;
  }
`;

interface Props {
  activeScreen: IAdministrationItemRoute | null;
  configurationWizard: boolean;
}

export const ContentSlider = observer<Props>(function ContentSlider({ activeScreen, configurationWizard }) {
  const optionsPanelService = useService(OptionsPanelService);
  const OptionsPanel = optionsPanelService.getPanelComponent();

  return styled(useStyles(styles, slideBoxStyles))(
    <SlideBox open={optionsPanelService.active}>
      <SlideElement>
        <ErrorBoundary remount>
          <content>
            <OptionsPanel />
          </content>
        </ErrorBoundary>
      </SlideElement>
      <SlideElement>
        <ErrorBoundary remount>
          <content>
            <ItemContent
              activeScreen={activeScreen}
              configurationWizard={configurationWizard}
            />
          </content>
        </ErrorBoundary>
        <SlideOverlay onClick={() => optionsPanelService.close()} />
      </SlideElement>
    </SlideBox>
  );
});

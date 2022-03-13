/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { BASE_LAYOUT_GRID_STYLES, Button, useFocus } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
    layout-grid {
      width: 100%;
      flex: 1;
    }

    layout-grid-inner {
      min-height: 100%;
    }

    layout-grid-cell {
      composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
      position: relative;
      border: solid 1px;
      padding: 16px 24px
    }

    p {
      line-height: 2;
      white-space: pre;
    }
  `;

export const FinishPage = observer(function FinishPage() {
  const translate = useTranslate();
  const service = useController(ConfigurationWizardService);
  const [focus] = useFocus<HTMLDivElement>({
    focusFirstChild: true,
  });

  return styled(useStyles(BASE_LAYOUT_GRID_STYLES, styles))(
    <layout-grid>
      <layout-grid-inner>
        <layout-grid-cell ref={focus} as='div' data-span='12'>
          <h3>{translate('administration_configuration_wizard_finish_title')}</h3>
          <p>{translate('administration_configuration_wizard_finish_message')}</p>

          <Button
            type="button"
            mod={['unelevated']}
            onClick={() => service.next()}
          >
            {translate('ui_stepper_finish')}
          </Button>
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
});

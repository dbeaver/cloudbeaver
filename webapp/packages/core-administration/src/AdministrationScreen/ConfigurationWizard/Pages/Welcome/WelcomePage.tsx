/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use, css } from 'reshadow';

import { Translate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

const styles = composes(
  css`
    layout-grid-cell {
      composes: theme-background-surface theme-text-on-surface from global;
    }

    layout-grid-cell {
      composes: theme-border-color-background from global;
    }
  `,
  css`
    layout-grid {
      width: 100%;
      flex: 1;
    }

    layout-grid-inner {
      min-height: 100%;
    }

    layout-grid-cell {
      position: relative;
      border: solid 1px;
      padding: 16px 24px
    }

    p {
      line-height: 2;
    }

    note {
      composes: theme-typography--body2 from global;
    }
  `
);

export function WelcomePage() {
  return styled(useStyles(styles))(
    <layout-grid as="div">
      <layout-grid-inner as="div">
        <layout-grid-cell as='div' {...use({ span: 12 })}>
          <h3><Translate token='administration_configuration_wizard_welcome_title'/></h3>
          <p><Translate token='administration_configuration_wizard_welcome_message'/></p>
          <note as='div'><Translate token='administration_configuration_wizard_welcome_note'/></note>
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
}

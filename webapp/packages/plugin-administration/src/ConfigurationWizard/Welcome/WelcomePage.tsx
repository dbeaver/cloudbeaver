/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, ColoredContainer, Group, GroupItem } from '@cloudbeaver/core-blocks';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
  p {
    line-height: 2;
    white-space: pre-wrap;
  }

  note {
    composes: theme-typography--body2 from global;
  }
`;

export const WelcomePage: React.FC = function WelcomePage() {
  return styled(useStyles(styles, BASE_CONTAINERS_STYLES))(
    <ColoredContainer wrap gap overflow parent>
      <Group form>
        <h3><Translate token='administration_configuration_wizard_welcome_title' /></h3>
        <GroupItem>
          <p><Translate token='administration_configuration_wizard_welcome_message' /></p>
          <note as='div'><Translate token='administration_configuration_wizard_welcome_note' /></note>
        </GroupItem>
      </Group>
    </ColoredContainer>
  );
};

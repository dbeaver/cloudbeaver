/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { AdministrationItemContentProps } from '@cloudbeaver/core-administration';
import {
  Button,
  ColoredContainer,
  Flex,
  Fill,
  Group,
  ObjectPropertyInfoForm,
  useClipboard,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { SystemInformationResource } from './SystemInformationResource.js';

export const SystemInformation: TabContainerPanelComponent<AdministrationItemContentProps> = observer(function SystemInformation() {
  const translate = useTranslate();
  const copy = useClipboard();
  const systemInformationResource = useResource(SystemInformation, SystemInformationResource, undefined);

  function copyToClipboard() {
    if (systemInformationResource.data) {
      copy(systemInformationResource.data.map(property => `${property.displayName}: ${property.value}`).join('\n'), true);
    }
  }

  return (
    <ColoredContainer overflow parent>
      <Group gap medium wrap>
        <ObjectPropertyInfoForm properties={systemInformationResource.data ?? []} small fill readOnly />
        <Flex>
          <Fill />
          <Button mod={['unelevated']} onClick={copyToClipboard}>
            {translate('ui_copy_to_clipboard')}
          </Button>
        </Flex>
      </Group>
    </ColoredContainer>
  );
});

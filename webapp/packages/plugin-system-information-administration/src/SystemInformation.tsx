/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import {
  AdministrationPageContent,
  AdministrationPageHeader,
  AdministrationPageTitle,
  type AdministrationItemContentProps,
} from '@cloudbeaver/core-administration';
import {
  Button,
  Group,
  ObjectPropertyInfoForm,
  useClipboard,
  useResource,
  useTranslate,
  useObjectPropertyCategories,
  GroupTitle,
  Container,
} from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { SystemInformationResource } from './SystemInformationResource.js';

export const SystemInformation: TabContainerPanelComponent<AdministrationItemContentProps> = observer(function SystemInformation() {
  const translate = useTranslate();
  const copy = useClipboard();
  const systemInformationResource = useResource(SystemInformation, SystemInformationResource, undefined);
  const properties = systemInformationResource.data ?? [];
  const { categories, isUncategorizedExists } = useObjectPropertyCategories(properties);

  function copyToClipboard() {
    if (systemInformationResource.data) {
      copy(
        systemInformationResource.data
          .map(property => `${property.category ? property.category + '/' : ''}${property.displayName}: ${property.value}`)
          .join('\n'),
        true,
      );
    }
  }

  return (
    <>
      <AdministrationPageHeader
        actionsSlot={
          <Button variant="secondary" onClick={copyToClipboard}>
            {translate('ui_copy_to_clipboard')}
          </Button>
        }
      >
        <AdministrationPageTitle>{translate('plugin_system_information_administration_tab_title')}</AdministrationPageTitle>
      </AdministrationPageHeader>
      <AdministrationPageContent>
        <div className="tw:shrink-0">
          <Group gap medium wrap>
            {isUncategorizedExists && (
              <Container gap>
                <ObjectPropertyInfoForm category={null} properties={properties} small fill readOnly />
              </Container>
            )}
            {categories.map(category => (
              <Container key={category} gap>
                <GroupTitle>{category}</GroupTitle>
                <ObjectPropertyInfoForm category={category} properties={properties} small fill readOnly />
              </Container>
            ))}
          </Group>
        </div>
      </AdministrationPageContent>
    </>
  );
});

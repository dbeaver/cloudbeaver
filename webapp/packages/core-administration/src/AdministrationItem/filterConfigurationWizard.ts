/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationItemType, type IAdministrationItem } from './IAdministrationItem.js';

export function filterConfigurationWizard(configurationWizard: boolean) {
  return (item: IAdministrationItem) =>
    configurationWizard ? item.type !== AdministrationItemType.Administration : item.type !== AdministrationItemType.ConfigurationWizard;
}

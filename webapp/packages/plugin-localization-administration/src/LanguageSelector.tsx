/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Select, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';

import { ConfigurationLocaleService } from './ConfigurationLocaleService.js';

export const LanguageSelector = observer(function LanguageSelector() {
  const localizationService = useService(LocalizationService);
  const serverConfigResource = useService(ServerConfigResource);
  const configurationLocaleService = useService(ConfigurationLocaleService);
  const translate = useTranslate();

  if (!serverConfigResource.configurationMode) {
    return null;
  }

  return (
    <Select
      items={localizationService.supportedLanguages}
      value={localizationService.currentLanguage}
      title={translate('core_settings_localization_settings_locale_label')}
      keySelector={locale => locale.isoCode}
      valueSelector={locale => locale.nativeName ?? locale.name}
      tiny
      noGrow
      portal
      onSelect={language => configurationLocaleService.changeLanguage(language)}
    />
  );
});

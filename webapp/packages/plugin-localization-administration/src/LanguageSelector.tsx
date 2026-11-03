/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { Select, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';

export const LanguageSelector = observer(function LanguageSelector() {
  const localizationService = useService(LocalizationService);
  const translate = useTranslate();
  const preferredLanguage = localizationService.preferredLanguage;

  useEffect(() => {
    localizationService.setLanguage(preferredLanguage);
  }, [localizationService, preferredLanguage]);

  return (
    <Select
      className="tw:mx-2"
      items={localizationService.supportedLanguages}
      value={localizationService.currentLanguage}
      keySelector={language => language.isoCode}
      valueSelector={language => language.nativeName ?? language.name}
      title={translate('plugin_localization_administration_language')}
      tiny
      inline
      portal
      onSelect={language => localizationService.setLanguage(language)}
    />
  );
});

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Link, Text, useTranslate } from '@cloudbeaver/core-blocks';

import type { InstructionComponent } from './VersionUpdateService.js';

export const BaseUpdateInstruction: InstructionComponent = function UpdateInstruction({ version, containerId, link, className }) {
  const translate = useTranslate();

  if (!link) {
    return <Text className={className}>{translate('version_update_instruction_link_not_provided')}</Text>;
  }

  return (
    <div className={className}>
      {translate('version_update_instruction')}{' '}
      <Link href={link} target="_blank" rel="noopener noreferrer" inline indicator>
        {translate('version_update_instruction_link')}
      </Link>
    </div>
  );
};

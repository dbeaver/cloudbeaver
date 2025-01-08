/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ActionIconButton } from '../ActionIconButton.js';
import { Flex } from '../Flex/Flex.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import classes from './GroupBack.module.css';

export const GroupBack: React.FC<React.HTMLAttributes<HTMLButtonElement>> = function GroupBack({ className, children, ...rest }) {
  const translate = useTranslate();
  const styles = useS(classes);

  return (
    <Flex gap="xs" align="center">
      <ActionIconButton className={s(styles, { button: true }, className)} name="angle" title={translate('ui_close')} {...rest} />
      {children}
    </Flex>
  );
};

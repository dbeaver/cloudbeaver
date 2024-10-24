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
import { filterLayoutFakeProps, getLayoutProps } from './filterLayoutFakeProps.js';
import styles from './GroupTitle.module.css';
import type { ILayoutSizeProps } from './ILayoutSizeProps.js';
import elementsSizeStyles from './shared/ElementsSize.module.css';

interface Props {
  sticky?: boolean;
  header?: boolean;
  onClose?: () => void;
}

export const GroupTitle: React.FC<Props & ILayoutSizeProps & React.HTMLAttributes<HTMLHeadingElement>> = function GroupTitle({
  sticky,
  header,
  className,
  children,
  onClose,
  ...rest
}) {
  const translate = useTranslate();
  const style = useS(styles, elementsSizeStyles);
  const divProps = filterLayoutFakeProps(rest);
  const layoutProps = getLayoutProps(rest);

  return (
    <h2 tabIndex={-1} {...divProps} className={s(style, { groupTitle: true, sticky, header, ...layoutProps }, className)}>
      {onClose ? (
        <Flex gap="xs" align="center">
          <ActionIconButton className={s(styles, { closeButton: true })} name="angle" title={translate('ui_close')} onClick={onClose} />
          {children}
        </Flex>
      ) : (
        children
      )}
    </h2>
  );
};

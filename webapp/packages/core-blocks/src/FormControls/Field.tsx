import { observer } from 'mobx-react-lite';
import type { HTMLAttributes, PropsWithChildren } from 'react';

import { getLayoutProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import elementsSizeStyles from '../Containers/shared/ElementsSize.m.css';
import { s } from '../s';
import { useS } from '../useS';
import fieldStyles from './Field.m.css';

type Props = ILayoutSizeProps &
  HTMLAttributes<HTMLDivElement> & {
    className?: string;
  };
export const Field: React.FC<PropsWithChildren<Props>> = observer(function Field({ children, className, ...rest }) {
  const styles = useS(fieldStyles, elementsSizeStyles);

  const layoutProps = getLayoutProps(rest);

  return (
    <div {...rest} className={s(styles, { ...layoutProps, field: true }, className)}>
      {children}
    </div>
  );
});

import { Button as AriaButton, type ButtonProps as AriaKitButtonProps } from '@ariakit/react';
import { Spinner } from '../Spinner/Spinner.js';
import { clsx } from '../utils/clsx.js';

export interface ButtonRootProps extends Omit<AriaKitButtonProps, 'clickOnEnter' | 'clickOnSpace'> {
  loading?: boolean;
  loader?: React.ReactNode;
}

export function ButtonRoot({ loading, loader, children, onClick, ...props }: ButtonRootProps) {
  if (loading) {
    props['aria-busy'] = true;
    props['data-loading'] = true;
  }

  return (
    <AriaButton onClick={loading ? () => null : onClick} {...props}>
      {loading && (loader ? loader : <Spinner className="tw:absolute" />)}
      <span className={clsx(loading && 'tw:opacity-0', 'tw:w-full')}>{children}</span>
    </AriaButton>
  );
}

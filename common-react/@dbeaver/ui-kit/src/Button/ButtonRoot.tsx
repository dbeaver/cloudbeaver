import { Button as AriaButton, type ButtonProps as AriaKitButtonProps } from '@ariakit/react';
import { Spinner } from '../Spinner/Spinner.js';
import { clsx } from '../utils/clsx.js';
import './ButtonRoot.css';

export interface ButtonRootProps extends Omit<AriaKitButtonProps, 'clickOnEnter' | 'clickOnSpace'> {
  loading?: boolean;
  loader?: React.ReactNode;
}

export function ButtonRoot({ loading, loader, children, onClick, className, ...props }: ButtonRootProps) {
  if (loading) {
    props['aria-busy'] = true;
    props['data-loading'] = true;
  }

  return (
    <AriaButton onClick={loading ? () => null : onClick} className={clsx(className, 'tw:relative')} {...props}>
      <div className={clsx('dbv-kit-button__content', loading && 'tw:opacity-0')}>{children}</div>
      {loading && <div className="dbv-kit-button__loader">{loader ? loader : <Spinner />}</div>}
    </AriaButton>
  );
}

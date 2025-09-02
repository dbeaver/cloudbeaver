import clsx from 'clsx';
import './Spinner.css';
import type { ControlSize } from '../types/controls.js';

export interface SpinnerProps {
  active?: boolean;
  className?: string;
  size?: ControlSize;
}

export function Spinner({ className, size, active = true }: SpinnerProps) {
  if (!active) {
    return null;
  }

  return (
    <span className={clsx('dbv-kit-spinner', size && `dbv-kit-spinner--${size}`, className)}>
      <svg className="dbv-kit-spinner__svg" viewBox="11 11 22 22">
        <circle className="dbv-kit-spinner__circle" cx="22" cy="22" r="9" fill="none"></circle>
      </svg>
    </span>
  );
}

import clsx from 'clsx';
import './Spin.css';
import type { ControlSize } from '../types/controls.js';

export interface SpinProps {
  enabled?: boolean;
  className?: string;
  size?: ControlSize;
}

export function Spin({ className, size, enabled = true }: SpinProps) {
  return (
    enabled && (
      <span className={clsx('dbv-kit-spin', size ? `dbv-kit-spin--${size}` : undefined, className)}>
        <svg className="dbv-kit-spin__svg tw:animate-spin" viewBox="11 11 22 22">
          <circle className="dbv-kit-spin__circle" cx="22" cy="22" r="9" fill="none"></circle>
        </svg>
      </span>
    )
  );
}

import '../src/index.css';
import './global.css';
import Icons from '../assets/icons/preload/icons.svg?react';

import type { GlobalProvider } from '@ladle/react';

export const Provider: GlobalProvider = ({ children }) => {
  return (
    <div>
      <Icons style={{ display: 'none' }} />
      {children}
    </div>
  );
};

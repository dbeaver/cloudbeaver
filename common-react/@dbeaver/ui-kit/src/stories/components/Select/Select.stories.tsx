import { Select } from '../../../Select/Select.js';

export const Default = () => {
  return (
    <>
      <h3>Theme</h3>
      <Select.Provider>
        <Select className="tw:w-[300px]" />
        <Select.Popover>
          <Select.Item value="Light">🌕 Light</Select.Item>
          <Select.Item value="Dark">🌘 Dark</Select.Item>
          <Select.Item disabled value="System">
            🌓 System
          </Select.Item>
        </Select.Popover>
        <Select.Label>Application color theme</Select.Label>
      </Select.Provider>
    </>
  );
};

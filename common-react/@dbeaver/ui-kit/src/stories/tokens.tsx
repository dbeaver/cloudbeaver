export const GlobalTokens = () => {
  return (
    <div className="tw:p-4 tw:my-4">
      <h1 className="tw:text-2xl tw:font-bold">Global CSS Tokens</h1>
      <p className="tw:text-base">
        This UI kit uses several global CSS tokens defined in the <code>index.css</code> file. These tokens help maintain consistency across the UI
        components. All DBeaver UI tokens are prefixed with <code>--dbv-kit-</code>. You can use these tokens to customize the UI kit to fit your
        application's design. Below are some of the key tokens used in the UI kit.
      </p>
      <div className="tw:my-4">
        <h2 className="tw:text-xl tw:font-semibold">Font Size</h2>
        <p className="tw:text-base" style={{ fontSize: 'var(--dbv-kit-font-size-base)' }}>
          Base font size: <code>--dbv-kit-font-size-base</code>
        </p>
        <p className="tw:text-base">
          The <code>--dbv-kit-font-size-base</code> token is used to set the base font size for text in the UI kit. It ensures consistent typography
          across different components.
        </p>
      </div>

      <div className="tw:my-4">
        <h2 className="tw:text-xl tw:font-semibold">Control Heights</h2>
        <p className="tw:text-base" style={{ height: 'var(--dbv-kit-control-height-small)' }}>
          Small control height: <code>--dbv-kit-control-height-small</code>
        </p>
        <p className="tw:text-base" style={{ height: 'var(--dbv-kit-control-height-medium)' }}>
          Medium control height: <code>--dbv-kit-control-height-medium</code>
        </p>
        <p className="tw:text-base" style={{ height: 'var(--dbv-kit-control-height-large)' }}>
          Large control height: <code>--dbv-kit-control-height-large</code>
        </p>
        <p className="tw:text-base" style={{ height: 'var(--dbv-kit-control-height-xlarge)' }}>
          Extra large control height: <code>--dbv-kit-control-height-xlarge</code>
        </p>
        <p className="tw:text-base">
          The <code>--control-height-*</code> tokens are used to define the height of various UI controls, such as buttons, selects, and input fields.
          These tokens ensure consistent sizing across different components. Use these tokens to set the height of controls in your application.
        </p>
      </div>
      <div className="tw:my-4">
        <h2 className="tw:text-xl tw:font-semibold">Base Sizes</h2>
        <p className="tw:text-base">
          The <code>--dbv-kit-font-size-base</code> and <code>--dbv-kit-control-height-base</code> tokens use <code>rem</code> units by default. This
          ensures that the base font size and control height are consistent with the user's browser settings. If the user changes the browser's font
          size, these base sizes will adjust accordingly, maintaining a consistent view.
        </p>
        <p className="tw:text-base">
          Other font sizes and control heights are calculated from these base sizes, ensuring proportional scaling across the UI components.
        </p>
      </div>
      <div className="tw:my-4">
        <h2>Borders</h2>
        <p>
          <div>
            <code>--dbv-kit-control-border-radius</code> <span className="comment">// Control border radius</span>
          </div>
          <div>
            <code>--dbv-kit-control-border-width </code> <span className="comment">// Control border width</span>
          </div>
          <div>
            <code>--dbv-kit-control-outline-width</code> <span className="comment">// Control outline width</span>
          </div>
        </p>
      </div>
      <div className="tw:my-4">
        <h2 className="tw:text-xl tw:font-semibold">Colors</h2>
        <p className="tw:text-base" style={{ color: 'var(--dbv-kit-color-foreground)' }}>
          Foreground color: <code>--dbv-kit-color-foreground</code>
        </p>
        <p className="tw:text-base" style={{ backgroundColor: 'var(--dbv-kit-color-background)' }}>
          Background color: <code>--dbv-kit-color-background</code>
        </p>
        <p className="tw:text-base" style={{ color: 'var(--dbv-kit-color-text)' }}>
          Text color: <code>--dbv-kit-color-text</code>
        </p>
        <p className="tw:text-base" style={{ backgroundColor: 'var(--dbv-kit-color-primary-50)' }}>
          Primary color (50): <code>--dbv-kit-color-primary-50</code>
        </p>
        <p className="tw:text-base" style={{ backgroundColor: 'var(--dbv-kit-color-primary-100)' }}>
          Primary color (100): <code>--dbv-kit-color-primary-100</code>
        </p>
        <p className="tw:text-base" style={{ backgroundColor: 'var(--dbv-kit-color-primary-200)' }}>
          Primary color (200): <code>--dbv-kit-color-primary-200</code>
        </p>
        <p className="tw:text-base text-white" style={{ backgroundColor: 'var(--dbv-kit-color-primary-500)' }}>
          Primary color (500): <code>--dbv-kit-color-primary-500</code>
        </p>
        <p className="tw:text-base text-white" style={{ backgroundColor: 'var(--dbv-kit-color-primary-600)' }}>
          Primary color (600): <code>--dbv-kit-color-primary-600</code>
        </p>
        <p className="tw:text-base text-white" style={{ backgroundColor: 'var(--dbv-kit-color-primary-700)' }}>
          Primary color (700): <code>--dbv-kit-color-primary-700</code>
        </p>
        <p className="tw:text-base text-white" style={{ backgroundColor: 'var(--dbv-kit-color-primary-800)' }}>
          Primary color (800): <code>--dbv-kit-color-primary-800</code>
        </p>
        <p className="tw:text-base text-white" style={{ backgroundColor: 'var(--dbv-kit-color-primary-900)' }}>
          Primary color (900): <code>--dbv-kit-color-primary-900</code>
        </p>
        <p
          className="tw:text-base tw:my-1"
          style={{
            backgroundColor: 'var(--dbv-kit-color-error-background)',
            color: 'var(--dbv-kit-color-error-text)',
            border: '2px solid  var(--dbv-kit-color-error-border)',
          }}
        >
          Error color: <code>--dbv-kit-color-error-background</code> / <code>--dbv-kit-color-error-text</code> /{' '}
          <code>--dbv-kit-color-error-border</code>
        </p>
        <p
          className="tw:text-base tw:my-1"
          style={{
            backgroundColor: 'var(--dbv-kit-color-info-background)',
            color: 'var(--dbv-kit-color-info-text)',
            border: '2px solid var(--dbv-kit-color-info-border)',
          }}
        >
          Info color: <code>--dbv-kit-color-info-background</code> / <code>--dbv-kit-color-info-text</code> / <code>--dbv-kit-color-info-border</code>
        </p>
        <p
          className="tw:text-base tw:my-1"
          style={{
            backgroundColor: 'var(--dbv-kit-color-warning-background)',
            color: 'var(--dbv-kit-color-warning-text)',
            border: '2px solid var(--dbv-kit-color-warning-border)',
          }}
        >
          Warning color: <code>--dbv-kit-color-warning-background</code> / <code>--dbv-kit-color-warning-text</code> /{' '}
          <code>--dbv-kit-color-warning-border</code>
        </p>
      </div>
    </div>
  );
};

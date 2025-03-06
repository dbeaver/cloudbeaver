export const GlobalTokens = () => {
  return (
    <div className="tw:p-4 tw:my-4">
      <h1 className="tw:text-2xl tw:font-bold">Global CSS Tokens</h1>
      <p>
        This UI kit uses several global CSS tokens defined in the <code>index.css</code> file. These tokens help maintain consistency across the UI
        components. All DBeaver UI tokens are prefixed with <code>--dbv-kit-</code>. You can use these tokens to customize the UI kit to fit your
        application's design. Below are some of the key tokens used in the UI kit.
      </p>
      <div className="tw:my-4">
        <h2 className="tw:text-xl tw:font-semibold">Font Size</h2>
        <code>--dbv-kit-font-size-base</code> - base font size <br />
        <code>--dbv-kit-font-size-base</code> - token is used to set the base font size for text in the UI kit. It ensures consistent typography
        across different components.
      </div>
      <div className="tw:my-4">
        <h2 className="tw:text-xl tw:font-semibold">Control Heights</h2>
        <p>
          <code>--dbv-kit-control-height-small</code> - Small control height
        </p>
        <p>
          <code>--dbv-kit-control-height-medium</code> - Medium control height
        </p>
        <p>
          <code>--dbv-kit-control-height-large</code> - Large control height
        </p>
        <p>
          <code>--dbv-kit-control-height-xlarge</code> - Extra large control height
        </p>
        <p>
          The <code>--control-height-*</code> tokens are used to define the height of various UI controls, such as buttons, selects, and input fields.
          These tokens ensure consistent sizing across different components. Use these tokens to set the height of controls in your application.
        </p>
      </div>
      <div className="tw:my-4">
        <h2 className="tw:text-xl tw:font-semibold">Base Sizes</h2>
        <code>--dbv-kit-font-size-base</code>
        <br />
        <code>--dbv-kit-control-height-base</code>
        <p>
          These tokens use <code>rem</code> units by default. This ensures that the base font size and control height are consistent with the user's
          browser settings. If the user changes the browser's font size, these base sizes will adjust accordingly, maintaining a consistent view.
        </p>
        <p>Other font sizes and control heights are calculated from these base sizes, ensuring proportional scaling across the UI components.</p>
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
        <p>
          <code>--dbv-kit-color-foreground</code> - Foreground color{' '}
          <span style={{ backgroundColor: 'var(--dbv-kit-color-foreground)' }} className="color-sample" />
        </p>
        <p>
          <code>--dbv-kit-color-background</code> - Background color
        </p>
        <p>
          <code>--dbv-kit-color-primary-50</code> - Primary color (50){' '}
          <span className="color-sample" style={{ backgroundColor: 'var(--dbv-kit-color-primary-50)' }}></span>
        </p>
        <p>
          <code>--dbv-kit-color-primary-100</code> - Primary color (100){' '}
          <span className="color-sample" style={{ backgroundColor: 'var(--dbv-kit-color-primary-100)' }}></span>
        </p>
        <p>
          <code>--dbv-kit-color-primary-200</code> - Primary color (200){' '}
          <span className="color-sample" style={{ backgroundColor: 'var(--dbv-kit-color-primary-200)' }}></span>
        </p>
        <p>
          <code>--dbv-kit-color-primary-500</code> - Primary color (500){' '}
          <span className="color-sample" style={{ backgroundColor: 'var(--dbv-kit-color-primary-500)' }}></span>
        </p>
        <p>
          <code>--dbv-kit-color-primary-600</code> - Primary color (600){' '}
          <span className="color-sample" style={{ backgroundColor: 'var(--dbv-kit-color-primary-600)' }}></span>
        </p>
        <p>
          <code>--dbv-kit-color-primary-700</code> - Primary color (700){' '}
          <span className="color-sample" style={{ backgroundColor: 'var(--dbv-kit-color-primary-700)' }}></span>
        </p>
        <p>
          <code>--dbv-kit-color-primary-800</code> - Primary color (800){' '}
          <span className="color-sample" style={{ backgroundColor: 'var(--dbv-kit-color-primary-800)' }}></span>
        </p>
        <p>
          <code>--dbv-kit-color-primary-900</code> - Primary color (900){' '}
          <span className="color-sample" style={{ backgroundColor: 'var(--dbv-kit-color-primary-900)' }}></span>
        </p>
        <p>
          <code>--dbv-kit-color-outline:</code> Default control outline color used for focused elements{' '}
          <span className="color-sample" style={{ backgroundColor: 'var(--dbv-kit-color-outline)' }}></span>
        </p>
        <p
          style={{
            backgroundColor: 'var(--dbv-kit-color-error-background)',
            color: 'var(--dbv-kit-color-error-text)',
            border: '4px solid  var(--dbv-kit-color-error-border)',
          }}
        >
          Error color: <code>--dbv-kit-color-error-background</code> / <code>--dbv-kit-color-error-text</code> /{' '}
          <code>--dbv-kit-color-error-border</code>
        </p>
        <p
          style={{
            backgroundColor: 'var(--dbv-kit-color-info-background)',
            color: 'var(--dbv-kit-color-info-text)',
            border: '4px solid var(--dbv-kit-color-info-border)',
          }}
        >
          Info color: <code>--dbv-kit-color-info-background</code> / <code>--dbv-kit-color-info-text</code> / <code>--dbv-kit-color-info-border</code>
        </p>
        <p
          style={{
            backgroundColor: 'var(--dbv-kit-color-warning-background)',
            color: 'var(--dbv-kit-color-warning-text)',
            border: '4px solid var(--dbv-kit-color-warning-border)',
          }}
        >
          Warning color: <code>--dbv-kit-color-warning-background</code> / <code>--dbv-kit-color-warning-text</code> /{' '}
          <code>--dbv-kit-color-warning-border</code>
        </p>
      </div>
      <h2>Others</h2>
      <p>
        <code>--dbv-kit-control-disabled-opacity:</code> opacity level for disabled controls, default is 0.5
      </p>
      <p>
        <code>--dbv-kit-control-outline-offset:</code> outline offset for focused elements
      </p>
    </div>
  );
};

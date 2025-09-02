import { Button, ButtonIcon, Icon, type IconProps } from '../../../index.js';

// All available icon names from the IconNames type
const iconNames = [
  'replace',
  'replace-all',
  'match-word',
  'case',
  'regex',
  'sort-asc',
  'sort-desc',
  'cross',
  'sort-unknown',
  'arrow-up',
  'arrow-down',
] as Array<IconProps['name']>;

const sizes = ['small', 'medium', 'large'] as const;

export function Documentation() {
  return (
    <div>
      <h1>Icon</h1>
      <p>Icon component for displaying SVG icons using the symbol/use pattern.</p>
      <h2>Usage</h2>
      <p>Use the Icon component to display predefined SVG icons in your application.</p>
      <h2>Anatomy</h2>
      <p>
        The Icon component consists of an SVG element that references icon symbols via the <code>&lt;use&gt;</code> element. Icons are sized
        automatically based on the size prop and support color customization.
      </p>
      <pre className="codeblock">
        {`
        <svg class="dbv-kit-icon" width="16" height="16" viewBox="0 0 16 16">
          <use href="#icon-search_sm" />
        </svg>
        `}
      </pre>
      <h2>Class names</h2>
      <p>
        The Icon component uses the following class names:
        <ul>
          <li>
            <code>dbv-kit-icon</code>: Base class for the icon.
          </li>
        </ul>
      </p>
      <h2>Props</h2>
      <table className="tw:table tw:w-full tw:border-collapse">
        <thead>
          <tr>
            <th className="tw:py-2 tw:border tw:px-2">Prop</th>
            <th className="tw:py-2 tw:border tw:px-2">Type</th>
            <th className="tw:py-2 tw:border tw:px-2">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="tw:border tw:p-2">name</td>
            <td className="tw:border tw:p-2">
              <pre>IconNames (required)</pre>
            </td>
            <td className="tw:border tw:p-2">The name of the icon to display.</td>
          </tr>
          <tr>
            <td className="tw:border tw:p-2">size</td>
            <td className="tw:border tw:p-2">
              <pre>small | medium | large</pre>
            </td>
            <td className="tw:border tw:p-2">Size of the icon. Default is 'small'.</td>
          </tr>
          <tr>
            <td className="tw:border tw:p-2">className</td>
            <td className="tw:border tw:p-2">
              <pre>string | undefined</pre>
            </td>
            <td className="tw:border tw:p-2">Additional CSS class name.</td>
          </tr>
          <tr>
            <td className="tw:border tw:p-2">color</td>
            <td className="tw:border tw:p-2">
              <pre>string | undefined</pre>
            </td>
            <td className="tw:border tw:p-2">Color of the icon.</td>
          </tr>
          <tr>
            <td className="tw:border tw:p-2">style</td>
            <td className="tw:border tw:p-2">
              <pre>React.CSSProperties | undefined</pre>
            </td>
            <td className="tw:border tw:p-2">Inline styles for the icon.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function AllIcons() {
  return (
    <div>
      <h1>All Available Icons</h1>
      <p>Here are all the available icons in the default (small) size:</p>
      <div className="tw:grid tw:grid-cols-4 tw:gap-4 tw:mt-4">
        {iconNames.map(iconName => (
          <div key={iconName} className="tw:flex tw:flex-col tw:items-center tw:p-4">
            <Icon name={iconName} />
            <code className="tw:text-xs tw:mt-2">{iconName}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sizes() {
  return (
    <div>
      <h1>Icon Sizes</h1>
      <p>Icons come in three different sizes: small (16px), medium (24px), and large (32px).</p>
      <div className="tw:space-y-6 tw:mt-4">
        {sizes.map(size => (
          <div key={size} className="tw:space-y-2">
            <h3 className="tw:text-lg tw:font-semibold tw:capitalize">
              {size} ({size === 'small' ? '16px' : size === 'medium' ? '24px' : '32px'})
            </h3>
            <div className="tw:flex tw:gap-4 tw:flex-wrap">
              {iconNames.map(iconName => (
                <div key={`${size}-${iconName}`} className="tw:flex tw:flex-col tw:items-center tw:p-2">
                  <Icon name={iconName} size={size} />
                  <code className="tw:text-xs tw:mt-1">{iconName}</code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WithColors() {
  const colors = ['red', 'green', 'blue'];

  return (
    <div>
      <h1>Icons with Colors</h1>
      <p>Icons can be customized with different colors using the color prop.</p>
      <div className="tw:space-y-4 tw:mt-4">
        {colors.map(color => (
          <div key={color} className="tw:space-y-2">
            <h3 className="tw:text-lg tw:font-semibold" style={{ color }}>
              Color: {color}
            </h3>
            <div className="tw:flex tw:gap-4 tw:flex-wrap">
              {iconNames.slice(0, 5).map(iconName => (
                <div key={`${color}-${iconName}`} className="tw:flex tw:flex-col tw:items-center tw:p-2 tw:border tw:rounded">
                  <Icon name={iconName} size="medium" color={color} />
                  <code className="tw:text-xs tw:mt-1">{iconName}</code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UsageExamples() {
  return (
    <div>
      <h1>Usage Examples</h1>
      <div className="tw:space-y-6 tw:mt-4">
        <div>
          <h3 className="tw:text-lg tw:font-semibold">In Buttons</h3>
          <Button>
            <ButtonIcon placement="start">
              <Icon name="cross" size="medium" color="white" className="tw:h-4 tw:w-4" />
            </ButtonIcon>
            Close
          </Button>
        </div>

        <div>
          <h3 className="tw:text-lg tw:font-semibold">As Status Indicators</h3>
          <div className="tw:space-y-2">
            <div className="tw:flex tw:items-center tw:gap-2">
              <Icon name="sort-asc" size="medium" color="green" />
              <span>Sorted ascending</span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <Icon name="sort-desc" size="medium" color="red" />
              <span>Sorted descending</span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <Icon name="sort-unknown" size="medium" color="gray" />
              <span>Unsorted</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="tw:text-lg tw:font-semibold">With Custom Styling</h3>
          <div className="tw:flex tw:items-center tw:gap-4">
            <Icon
              name="replace"
              size="large"
              style={{
                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
                transform: 'rotate(15deg)',
              }}
            />
            <Icon name="regex" size="medium" className="tw:opacity-50 tw:hover:opacity-100 tw:transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
}

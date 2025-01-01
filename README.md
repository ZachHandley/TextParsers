# TextUtils

A powerful text utility library for parsing, masking, and formatting text content. Parse URLs, hashtags, mentions, emails, markdown elements, and format phone numbers, dates, and more.

## Features

- 🔍 Parse and extract:
  - URLs (www., http:, https:, domain.com)
  - Hashtags (#example)
  - Mentions (@username)
  - Email addresses
  - Phone numbers
  - Markdown elements (links, headings, lists, emphasis)
- 📞 Format and mask:
  - Phone numbers: (123) 456-7890
  - Dates: MM/DD/YYYY
  - Currency: $1,234.56
  - Custom masks
- 📍 Position-aware matching
- 🎯 Configurable parsing options
- 🔗 Customizable URL generation
- 📦 Zero dependencies
- 💪 TypeScript-first

## Installation

```bash
npm install @zachhandley/text-utils
# or
yarn add @zachhandley/text-utils
# or
pnpm add @zachhandley/text-utils
```

## Usage

```typescript
import { createTextUtils } from "@zachhandley/text-utils";

// Create a utils instance with specific options
const utils = createTextUtils({
  parser: {
    urls: true,
    hashtags: true,
    mentions: true,
    phones: true,
  },
});

// Process text with parsing and masking
const text = "Call 1234567890 or visit https://example.com! #support @sarah";
const result = utils.processText(text, {
  parse: {
    types: ["phones", "urls", "hashtags", "mentions"],
    baseUrls: {
      hashtags: "https://twitter.com/hashtag",
      mentions: "https://twitter.com",
    },
  },
  mask: {
    phones: true,
  },
});

console.log(result.matches);
/* Output:
[
  {
    type: 'phone',
    text: '1234567890',
    value: '(123) 456-7890',
    position: { start: 5, end: 15 },
    url: 'tel:1234567890'
  },
  {
    type: 'url',
    text: 'https://example.com',
    value: 'https://example.com',
    position: { start: 22, end: 40 },
    url: 'https://example.com'
  },
  {
    type: 'hashtag',
    text: '#support',
    value: 'support',
    position: { start: 42, end: 50 },
    url: 'https://twitter.com/hashtag/support'
  },
  {
    type: 'mention',
    text: '@sarah',
    value: 'sarah',
    position: { start: 51, end: 57 },
    url: 'https://twitter.com/sarah'
  }
]
*/
```

## API

### `TextUtils`

The main class combining parsing and masking functionality.

```typescript
const utils = createTextUtils(options);
```

#### Options

```typescript
type Options = {
  parser?: {
    urls?: boolean;
    hashtags?: boolean;
    mentions?: boolean;
    emails?: boolean;
    phones?: boolean;
    markdownLinks?: boolean;
    markdownHeadings?: boolean;
    markdownLists?: boolean;
    markdownEmphasis?: boolean;
    all?: boolean;
  };
  mask?: {
    mask?: string | string[];
    tokens?: Record<string, MaskToken>;
    placeholder?: string;
    autoClear?: boolean;
  };
};
```

#### Methods

##### Parsing

- `parse(text: string)`: Parse text and return all matches
- `parseMany(texts: string[])`: Parse multiple strings
- `findLinkableElements(text: string, baseUrls?)`: Find all linkable elements with positions
- `extractUrls(text: string)`: Extract only URLs
- `extractMentions(text: string)`: Extract only mentions
- `extractHashtags(text: string)`: Extract only hashtags
- `extractPhones(text: string)`: Extract only phone numbers

##### Masking

- `mask(value: string, maskOpt: string | MaskOptions)`: Apply a mask to a value
- `formatPhoneNumber(phone: string)`: Format a phone number
- `formatDate(date: string)`: Format a date
- `formatCurrency(amount: string | number)`: Format currency

##### Combined

- `processText(text: string, options)`: Process text with both parsing and masking

## Examples

### Basic Parsing

```typescript
const utils = createTextUtils();

// Parse URLs, hashtags, mentions, and emails
const result = utils.parse(
  "Email me@example.com or visit https://example.com #help"
);
console.log(result);
```

### Formatting

```typescript
const utils = createTextUtils();

console.log(utils.formatPhoneNumber("1234567890"));
// "(123) 456-7890"

console.log(utils.formatDate("12252023"));
// "12/25/2023"

console.log(utils.formatCurrency("1234.5"));
// "$1,234.50"
```

### Combined Processing

```typescript
const utils = createTextUtils();

const text = "Contact 1234567890 or email support@example.com";
const result = utils.processText(text, {
  parse: {
    types: ["phones", "emails"],
  },
  mask: {
    phones: true,
  },
});

console.log(result.matches);
// Includes formatted phone number and email with positions
```

## Contributing

If you want a feature, make an issue or create a PR!

## License

MIT - AKA I don't really care what you do with it, it's not anything fancy!

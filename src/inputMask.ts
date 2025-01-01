export type MaskToken = {
  pattern: RegExp;
  optional?: boolean;
  transform?: (char: string) => string;
};

export type MaskOptions = {
  mask: string | string[];
  tokens?: Record<string, MaskToken>;
  placeholder?: string;
  autoClear?: boolean;
  stripMask?: boolean;
  allowEmpty?: boolean;
};

export class InputMask {
  private static readonly DEFAULT_TOKENS: Record<string, MaskToken> = {
    "9": {
      pattern: /\d/,
      transform: (char) => char,
    },
    a: {
      pattern: /[a-zA-Z]/,
      transform: (char) => char.toLowerCase(),
    },
    A: {
      pattern: /[a-zA-Z]/,
      transform: (char) => char.toUpperCase(),
    },
    "*": {
      pattern: /[a-zA-Z0-9]/,
    },
    "#": {
      pattern: /[0-9a-zA-Z]/,
    },
    x: {
      pattern: /[0-9a-fA-F]/,
    },
    X: {
      pattern: /[0-9a-fA-F]/,
      transform: (char) => char.toUpperCase(),
    },
  };

  private static readonly PRESET_MASKS: Record<string, MaskOptions> = {
    phone: {
      mask: "(999) 999-9999",
      autoClear: true,
    },
    phoneExt: {
      mask: "(999) 999-9999? x99999",
      autoClear: false,
    },
    phoneInt: {
      mask: "+9 (999) 999-9999",
      autoClear: true,
    },
    date: {
      mask: "99/99/9999",
      placeholder: "mm/dd/yyyy",
    },
    time: {
      mask: "99:99",
      placeholder: "hh:mm",
    },
    datetime: {
      mask: "99/99/9999 99:99",
      placeholder: "mm/dd/yyyy hh:mm",
    },
    ssn: {
      mask: "999-99-9999",
      autoClear: true,
    },
    creditCard: {
      mask: "9999 9999 9999 9999",
      autoClear: true,
    },
    currency: {
      mask: "$999,999,999.99",
      autoClear: false,
      allowEmpty: true,
    },
    ipv4: {
      mask: "999.999.999.999",
      autoClear: true,
    },
    mac: {
      mask: "XX:XX:XX:XX:XX:XX",
      tokens: {
        X: {
          pattern: /[0-9A-F]/i,
          transform: (char) => char.toUpperCase(),
        },
      },
    },
  };

  private options: Required<MaskOptions>;
  private tokens: Record<string, MaskToken>;

  constructor(options?: MaskOptions) {
    this.options = {
      mask: options?.mask || "",
      tokens: options?.tokens || {},
      placeholder: options?.placeholder || "_",
      autoClear: options?.autoClear ?? true,
      stripMask: options?.stripMask ?? false,
      allowEmpty: options?.allowEmpty ?? false,
    };
    this.tokens = { ...InputMask.DEFAULT_TOKENS, ...this.options.tokens };
  }

  /**
   * Apply mask to input value
   */
  mask(value: string, maskOpt?: string | MaskOptions): string {
    // Handle preset masks
    if (typeof maskOpt === "string" && maskOpt in InputMask.PRESET_MASKS) {
      return this.applyMask(value, InputMask.PRESET_MASKS[maskOpt]);
    }

    // Handle custom mask options
    const options = typeof maskOpt === "object" ? maskOpt : this.options;
    return this.applyMask(value, options);
  }

  /**
   * Apply mask with specific options
   */
  private applyMask(value: string, options: MaskOptions): string {
    const masks = Array.isArray(options.mask) ? options.mask : [options.mask];
    const tokens = { ...this.tokens, ...options.tokens };

    // Try each mask pattern until one fits
    for (const pattern of masks) {
      const result = this.processValue(value, pattern, tokens, options);
      if (result !== null) {
        return result;
      }
    }

    // If no mask fits and empty is allowed, return empty string
    if (options.allowEmpty && !value) {
      return "";
    }

    // Default to first mask pattern
    return this.processValue(value, masks[0], tokens, options) || "";
  }

  /**
   * Process value against a single mask pattern
   */
  private processValue(
    value: string,
    pattern: string,
    tokens: Record<string, MaskToken>,
    options: MaskOptions
  ): string | null {
    let result = "";
    let valueIndex = 0;
    let isOptional = false;

    for (const maskChar of pattern) {
      if (valueIndex >= value.length) {
        return isOptional ? result : options.autoClear ? "" : null;
      }

      if (maskChar === "?") {
        isOptional = true;
        continue;
      }

      const token = tokens[maskChar];
      if (token) {
        // This is a token that needs validation
        while (valueIndex < value.length) {
          const char = value[valueIndex];
          valueIndex++;

          if (token.pattern.test(char)) {
            result += token.transform ? token.transform(char) : char;
            break;
          } else if (!isOptional) {
            return options.autoClear ? "" : null;
          }
        }
      } else {
        // This is a literal character
        result += maskChar;
        if (value[valueIndex] === maskChar) {
          valueIndex++;
        }
      }
    }

    return result;
  }

  /**
   * Remove mask characters from value
   */
  stripMask(value: string): string {
    if (!this.options.stripMask) return value;

    return value.replace(/[^0-9a-zA-Z]/g, "");
  }

  /**
   * Validate if value matches mask pattern completely
   */
  isComplete(value: string): boolean {
    const masks = Array.isArray(this.options.mask)
      ? this.options.mask
      : [this.options.mask];

    return masks.some(
      (pattern) =>
        this.processValue(value, pattern, this.tokens, this.options) !== null
    );
  }
}

export const createMask = (options?: MaskOptions) => new InputMask(options);
export const defaultMask = new InputMask();

import {
  TextParser,
  type ParseOptions,
  type TextMatch,
  createParser,
} from "./textParser";
import { InputMask, type MaskOptions, createMask } from "./inputMask";

export * from "./textParser";
export * from "./inputMask";

export class TextUtils {
  private parser: TextParser;
  private inputMask: InputMask;

  constructor(options?: { parser?: ParseOptions; mask?: MaskOptions }) {
    this.parser = new TextParser(options?.parser);
    this.inputMask = new InputMask(options?.mask);
  }

  /**
   * Text Parsing Methods
   */
  parse(text: string) {
    return this.parser.parse(text);
  }

  parseMany(texts: string[]) {
    return this.parser.parseMany(texts);
  }

  findLinkableElements(
    text: string,
    baseUrls?: {
      hashtags?: string;
      mentions?: string;
      assets?: string;
    }
  ) {
    return this.parser.findLinkableElements(text, baseUrls);
  }

  /**
   * Input Masking Methods
   */
  mask(value: string, maskOpt: string | MaskOptions) {
    return this.inputMask.mask(value, maskOpt);
  }

  stripMask(value: string) {
    return this.inputMask.stripMask(value);
  }

  isComplete(value: string) {
    return this.inputMask.isComplete(value);
  }

  /**
   * Convenience Methods
   */
  formatPhoneNumber(phone: string) {
    return this.inputMask.mask(phone, "phone");
  }

  formatDate(date: string) {
    return this.inputMask.mask(date, "date");
  }

  formatCurrency(amount: string | number) {
    return this.inputMask.mask(amount.toString(), "currency");
  }

  /**
   * Extract specific types of matches from text
   */
  extractUrls(text: string): string[] {
    return this.parser.parse(text).urls;
  }

  extractMentions(text: string): string[] {
    return this.parser.parse(text).mentions;
  }

  extractHashtags(text: string): string[] {
    return this.parser.parse(text).hashtags;
  }

  extractPhones(text: string): string[] {
    return this.parser.parse(text).phones;
  }

  /**
   * Enhanced Combined Utilities
   */
  processText(
    text: string,
    options: {
      parse?: {
        types?: ("urls" | "hashtags" | "mentions" | "phones" | "emails")[];
        baseUrls?: {
          hashtags?: string;
          mentions?: string;
          assets?: string;
        };
      };
      mask?: {
        phones?: boolean;
        dates?: boolean;
        currency?: boolean;
      };
    }
  ) {
    // First find all matches with their positions
    const matches = this.findLinkableElements(text, options.parse?.baseUrls);

    // Apply masking if requested
    if (options.mask) {
      matches.forEach((match) => {
        if (match.type === "phone" && options.mask?.phones) {
          match.value = this.formatPhoneNumber(match.value);
        }
        // Add more masking types as needed
      });
    }

    return {
      matches,
      // Filter matches by requested types
      filtered: options.parse?.types
        ? matches.filter((m) => options.parse?.types?.includes(m.type as any))
        : matches,
      // Original text for reference
      originalText: text,
    };
  }
}

// Factory function to create a new TextUtils instance
export const createTextUtils = (options?: {
  parser?: ParseOptions;
  mask?: MaskOptions;
}) => new TextUtils(options);

// Default instance with all options enabled
export const defaultUtils = new TextUtils({
  parser: { all: true },
});

// Type exports
export type { ParseOptions, TextMatch, MaskOptions };

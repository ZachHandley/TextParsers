export type ParseOptions = {
  urls?: boolean; // Parse URLs (www., http:, etc)
  hashtags?: boolean; // Parse #hashtags
  mentions?: boolean; // Parse @mentions
  emails?: boolean; // Parse email addresses
  phones?: boolean; // Parse phone numbers
  markdownLinks?: boolean; // Parse markdown links [text](url)
  markdownHeadings?: boolean; // Parse # headings
  markdownLists?: boolean; // Parse - and 1. lists
  markdownEmphasis?: boolean; // Parse *italic* and **bold**
  all?: boolean; // Enable all parsers
};

export type TextMatch = {
  type: "url" | "hashtag" | "mention" | "email" | "markdown-link" | "phone";
  text: string; // The original text
  value: string; // The extracted value (e.g., username without @)
  position: {
    start: number;
    end: number;
  };
  url?: string; // The URL we'd use if linking
};

// RegEx patterns
export const patterns = {
  // Matches URLs starting with http/https/ftp or www.
  url: /\b(?:https?:\/\/|www\.)\S+\.[a-z]{2,}(?:\/[^\s]*)?|\b[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?\b/gi,

  // Matches hashtags that start with # and contain letters/numbers
  hashtag: /\B#[a-z][a-z0-9._-]*\b/gi,

  // Matches @mentions
  mention: /\B@[a-z][a-z0-9._-]*\b/gi,

  // Matches email addresses
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,

  // Matches phone numbers
  phone:
    /(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\b/g,

  // Markdown patterns
  markdown: {
    // Links [text](url)
    links: /\[([^\]]+)\]\(([^)]+)\)/g,

    // Headings (# Title, ## Subtitle, etc)
    headings: /^(#{1,6})\s+(.+)$/gm,

    // Lists (both bullet and numbered)
    bulletList: /^[-*+]\s+(.+)$/gm,
    numberedList: /^\d+\.\s+(.+)$/gm,

    // Emphasis
    bold: /\*\*([^*]+)\*\*|__([^_]+)__/g,
    italic: /\*([^*]+)\*|_([^_]+)_/g,
  },
};

export class TextParser {
  private options: ParseOptions;

  constructor(options: ParseOptions = { all: true }) {
    this.options = {
      urls: options.all || options.urls,
      hashtags: options.all || options.hashtags,
      mentions: options.all || options.mentions,
      emails: options.all || options.emails,
      phones: options.all || options.phones,
      markdownLinks: options.all || options.markdownLinks,
      markdownHeadings: options.all || options.markdownHeadings,
      markdownLists: options.all || options.markdownLists,
      markdownEmphasis: options.all || options.markdownEmphasis,
    };
  }

  /**
   * Parse a single string and return matches
   */
  parse(text: string) {
    const matches = {
      urls: [] as string[],
      hashtags: [] as string[],
      mentions: [] as string[],
      emails: [] as string[],
      phones: [] as string[],
      markdown: {
        links: [] as Array<{ text: string; url: string }>,
        headings: [] as Array<{ level: number; text: string }>,
        lists: {
          bullet: [] as string[],
          numbered: [] as string[],
        },
        emphasis: {
          bold: [] as string[],
          italic: [] as string[],
        },
      },
    };

    if (this.options.urls) {
      matches.urls = [...text.matchAll(patterns.url)].map((m) => m[0]);
    }

    if (this.options.hashtags) {
      matches.hashtags = [...text.matchAll(patterns.hashtag)].map((m) => m[0]);
    }

    if (this.options.mentions) {
      matches.mentions = [...text.matchAll(patterns.mention)].map((m) => m[0]);
    }

    if (this.options.emails) {
      matches.emails = [...text.matchAll(patterns.email)].map((m) => m[0]);
    }

    if (this.options.phones) {
      matches.phones = [...text.matchAll(patterns.phone)].map((m) => {
        const [full, countryCode, area, prefix, line, ext] = m;
        let formatted = "";

        if (countryCode) {
          formatted += `+${countryCode} `;
        }

        formatted += `(${area}) ${prefix}-${line}`;

        if (ext) {
          formatted += ` x${ext}`;
        }

        return formatted;
      });
    }

    if (this.options.markdownLinks) {
      matches.markdown.links = [...text.matchAll(patterns.markdown.links)].map(
        (m) => ({ text: m[1], url: m[2] })
      );
    }

    if (this.options.markdownHeadings) {
      matches.markdown.headings = [
        ...text.matchAll(patterns.markdown.headings),
      ].map((m) => ({ level: m[1].length, text: m[2] }));
    }

    if (this.options.markdownLists) {
      matches.markdown.lists.bullet = [
        ...text.matchAll(patterns.markdown.bulletList),
      ].map((m) => m[1]);
      matches.markdown.lists.numbered = [
        ...text.matchAll(patterns.markdown.numberedList),
      ].map((m) => m[1]);
    }

    if (this.options.markdownEmphasis) {
      matches.markdown.emphasis.bold = [
        ...[...text.matchAll(patterns.markdown.bold)].map((m) => m[1] || m[2]),
      ];
      matches.markdown.emphasis.italic = [
        ...[...text.matchAll(patterns.markdown.italic)].map(
          (m) => m[1] || m[2]
        ),
      ];
    }

    return matches;
  }

  /**
   * Parse multiple strings and return matches for each
   */
  parseMany(texts: string[]) {
    return texts.map((text) => this.parse(text));
  }

  /**
   * Find all linkable elements in text with their positions
   */
  findLinkableElements(
    text: string,
    baseUrls?: {
      hashtags?: string;
      mentions?: string;
      assets?: string;
    }
  ): TextMatch[] {
    const matches: TextMatch[] = [];

    if (this.options.urls) {
      for (const match of text.matchAll(patterns.url)) {
        matches.push({
          type: "url",
          text: match[0],
          value: match[0],
          position: {
            start: match.index!,
            end: match.index! + match[0].length,
          },
          url: match[0].startsWith("http") ? match[0] : `https://${match[0]}`,
        });
      }
    }

    if (this.options.hashtags) {
      for (const match of text.matchAll(patterns.hashtag)) {
        const tag = match[0].slice(1);
        matches.push({
          type: "hashtag",
          text: match[0],
          value: tag,
          position: {
            start: match.index!,
            end: match.index! + match[0].length,
          },
          url: baseUrls?.hashtags
            ? `${baseUrls.hashtags.replace(/\/$/, "")}/${tag}`
            : `/tags/${tag}`,
        });
      }
    }

    if (this.options.mentions) {
      for (const match of text.matchAll(patterns.mention)) {
        const username = match[0].slice(1);
        matches.push({
          type: "mention",
          text: match[0],
          value: username,
          position: {
            start: match.index!,
            end: match.index! + match[0].length,
          },
          url: baseUrls?.mentions
            ? `${baseUrls.mentions.replace(/\/$/, "")}/${username}`
            : `/users/${username}`,
        });
      }
    }

    if (this.options.emails) {
      for (const match of text.matchAll(patterns.email)) {
        matches.push({
          type: "email",
          text: match[0],
          value: match[0],
          position: {
            start: match.index!,
            end: match.index! + match[0].length,
          },
          url: `mailto:${match[0]}`,
        });
      }
    }

    if (this.options.phones) {
      for (const match of text.matchAll(patterns.phone)) {
        const [full, countryCode, area, prefix, line, ext] = match;
        let formatted = "";
        let value = "";

        if (countryCode) {
          formatted += `+${countryCode} `;
          value += `+${countryCode}`;
        }

        formatted += `(${area}) ${prefix}-${line}`;
        value += `${area}${prefix}${line}`;

        if (ext) {
          formatted += ` x${ext}`;
          value += `;${ext}`;
        }

        matches.push({
          type: "phone",
          text: match[0],
          value: formatted,
          position: {
            start: match.index!,
            end: match.index! + match[0].length,
          },
          url: `tel:${value}`,
        });
      }
    }

    if (this.options.markdownLinks) {
      for (const match of text.matchAll(patterns.markdown.links)) {
        const url = match[2];
        matches.push({
          type: "markdown-link",
          text: match[0],
          value: match[1],
          position: {
            start: match.index!,
            end: match.index! + match[0].length,
          },
          url:
            url.startsWith("http") || !baseUrls?.assets
              ? url
              : `${baseUrls.assets.replace(/\/$/, "")}/${url.replace(
                  /^\//,
                  ""
                )}`,
        });
      }
    }

    return matches.sort((a, b) => a.position.start - b.position.start);
  }
}

export const createParser = (options: ParseOptions = { all: true }) =>
  new TextParser(options);
export const defaultParser = new TextParser();

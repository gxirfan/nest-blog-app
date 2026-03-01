import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CensorService {
  constructor(private readonly configService: ConfigService) {}

  censor(text: string): string {
    if (!text) return text;

    const rawBannedWords =
      this.configService.getOrThrow<string>('BANNED_WORDS');
    const bannedWords: string[] = rawBannedWords
      .split(',')
      .map((w) => w.trim().toLowerCase());
    const sortedBannedWords = bannedWords.sort((a, b) => b.length - a.length);

    const rawReplacements = this.configService.getOrThrow<string>(
      'FILTER_REPLACEMENTS',
    );
    const replacements: Record<string, string> = JSON.parse(rawReplacements);
    const patternFromEnv =
      this.configService.getOrThrow<string>('SEARCH_SAFE_PATTERN') || 'a-z0-9';
    let normalizedText = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(new RegExp(`[^${patternFromEnv}]`, 'gi'), '')
      .replace(/(.)\1{1,}/g, '$1');

    for (const [key, value] of Object.entries(replacements)) {
      normalizedText = normalizedText.split(key).join(value);
    }

    const regex = new RegExp(`[^${patternFromEnv}]`, 'gi');
    const searchSafeText = normalizedText.replace(regex, '');

    const normalizeWord = (word: string): string => {
      let normalized = word
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(new RegExp(`[^${patternFromEnv}]`, 'gi'), '')
        .replace(/(.)\1{1,}/g, '$1');
      for (const [key, value] of Object.entries(replacements)) {
        normalized = normalized.split(key).join(value);
      }
      return normalized.replace(new RegExp(`[^${patternFromEnv}]`, 'gi'), '');
    };

    let censoredText = text;
    const pleasantEmojis = [
      // nature and calm
      '✨',
      '🌈',
      '🌱',
      '🕊️',
      '🦋',
      '🌸',
      '🍀',
      '☀️',
      '🌊',
      '🍃',
      // fun
      '🎉',
      '🎈',
      '🎊',
      '🎀',
      '🪄',
      '🍭',
      '🍦',
      '🎨',
      '🪁',
      // cute animals
      '🦄',
      '🐱',
      '🐼',
      '🐥',
      '🦊',
      '🐨',
      '🐝',
      '🐬',
      // positive
      '💎',
      '⭐',
      '🎈',
      '🛸',
      '🚀',
      '🔮',
      '🧸',
      '🎁',
      // fun
      '🍿',
      '🍕',
      '🌵',
      '🍄',
      '🦖',
      '🤖',
      '👾',
      '🎭',
    ];

    const safeWords = this.configService
      .getOrThrow<string>('SAFE_WORDS')
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    sortedBannedWords.forEach((word: string) => {
      if (word.length < 3) return;

      const normalizedWord = normalizeWord(word);
      if (!searchSafeText.includes(normalizedWord)) return;

      const pattern = word
        .split('')
        .map((char) => {
          if (char === ' ') return '\\s+';
          return `${char}+[^${patternFromEnv}]*`;
        })
        .join('');

      const wordRegex = new RegExp(pattern, 'gi');
      censoredText = censoredText.replace(
        wordRegex,
        (match, offset, fullText) => {
          const start = fullText.lastIndexOf(' ', offset) + 1;
          let end = fullText.indexOf(' ', offset + match.length);
          if (end === -1) end = fullText.length;

          const wholeWord = fullText
            .substring(start, end)
            .toLowerCase()
            .replace(/[.,!?;:]/g, '');

          if (
            safeWords.some((safe) => wholeWord.includes(safe.toLowerCase()))
          ) {
            return match;
          }

          const charBefore = fullText[offset - 1] || '';
          const charAfter = fullText[offset + match.length] || '';
          const isLetter = (char: string) =>
            patternFromEnv.includes(char.toLowerCase());

          const isPartBefore = isLetter(charBefore);
          const isPartAfter = isLetter(charAfter);
          const isInsideWord = isPartBefore || isPartAfter;

          if (!isInsideWord || match.trim().length >= 3) {
            return (
              pleasantEmojis[
                Math.floor(Math.random() * pleasantEmojis.length)
              ] + ' '
            );
          }

          if (isInsideWord && match.trim().length < 3) {
            return match;
          }

          return (
            pleasantEmojis[Math.floor(Math.random() * pleasantEmojis.length)] +
            ' '
          );
        },
      );
    });

    return censoredText;
  }
}

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

    const rawReplacements = this.configService.getOrThrow<string>(
      'FILTER_REPLACEMENTS',
    );
    const replacements: Record<string, string> = JSON.parse(rawReplacements);

    let normalizedText = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9şğüıöç]/gi, '')
      .replace(/(.)\1{1,}/g, '$1');

    // Apply FILTER_REPLACEMENTS (e.g., @ -> a, 0 -> o)
    for (const [key, value] of Object.entries(replacements)) {
      normalizedText = normalizedText.split(key).join(value);
    }

    const patternFromEnv =
      this.configService.getOrThrow<string>('SEARCH_SAFE_PATTERN') || 'a-z0-9';

    const regex = new RegExp(`[^${patternFromEnv}]`, 'gi');

    const searchSafeText = normalizedText.replace(regex, '');

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

    bannedWords.forEach((word: string) => {
      if (word.length < 3) return;
      if (!searchSafeText.includes(word)) return;

      const pattern = word
        .split('')
        .map((char) => `${char}+[^a-z0-9ğüşıöç]*`)
        .join('');

      // 'gi' for global and case-insensitive search
      const regex = new RegExp(pattern, 'gi');

      // Censor
      censoredText = censoredText.replace(regex, () => {
        return (
          pleasantEmojis[Math.floor(Math.random() * pleasantEmojis.length)] +
          ' '
        );
      });
    });

    return censoredText;
  }
}

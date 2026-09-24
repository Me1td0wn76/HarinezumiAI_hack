import { BadRequestException } from '@nestjs/common';
import { TAG_MAX_LENGTH, TAG_MAX_PER_EVENT } from '@lt/shared';

/**
 * タグ1つを正規化する。前後の空白と先頭の # を除き、英字は小文字にする（日本語はそのまま）。
 * 空になったら null。
 */
export function normalizeTag(raw: string): string | null {
  const tag = raw
    .trim()
    .replace(/^[#＃]+/, '')
    .trim()
    .toLowerCase();
  if (!tag) return null;
  if (tag.length > TAG_MAX_LENGTH) {
    throw new BadRequestException(`タグは${TAG_MAX_LENGTH}文字以内にしてください: ${tag}`);
  }
  if (/[\s,、，#＃]/.test(tag)) {
    throw new BadRequestException(`タグに空白や区切り文字は使えません: ${tag}`);
  }
  return tag;
}

/** 配列を正規化し、重複を除き、個数上限を検証する */
export function normalizeTags(raw: string[] | undefined): string[] {
  const tags: string[] = [];
  for (const r of raw ?? []) {
    const tag = normalizeTag(r);
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  if (tags.length > TAG_MAX_PER_EVENT) {
    throw new BadRequestException(`タグは${TAG_MAX_PER_EVENT}個までです`);
  }
  return tags;
}

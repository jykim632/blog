import type { TiptapDocument } from '../../../functions/api/admin/posts/schema';

export interface PublicPost {
  slug: string;
  title: string;
  summary: string;
  categoryName: string | null;
  tags: string[];
  publishedAt: string;
  coverImageUrl: string | null;
  contentJson?: TiptapDocument;
}

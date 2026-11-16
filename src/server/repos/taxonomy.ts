import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { Term } from "@/types/content";
import { getDb, schema } from "../db";

const { categories, postCategories, postTags, posts, tags } = schema;

/** Kategori dengan jumlah post TERBIT dan ID induk (0 bila tidak ada). */
export async function listCategories(): Promise<Term[]> {
  const parent = alias(categories, "parent");
  const rows = await getDb()
    .select({
      rowId: categories.id,
      legacyId: categories.legacyId,
      slug: categories.slug,
      path: categories.path,
      name: categories.name,
      description: categories.description,
      parentRowId: parent.id,
      parentLegacyId: parent.legacyId,
      count: sql<number>`count(${posts.id})::int`,
    })
    .from(categories)
    .leftJoin(parent, eq(parent.id, categories.parentId))
    .leftJoin(postCategories, eq(postCategories.categoryId, categories.id))
    .leftJoin(posts, and(eq(posts.id, postCategories.postId), eq(posts.status, "published")))
    .groupBy(categories.id, parent.id)
    .orderBy(categories.id);
  return rows.map((r) => ({
    id: r.legacyId ?? r.rowId,
    slug: r.slug,
    path: r.path,
    name: r.name,
    description: r.description,
    count: r.count,
    parent: r.parentLegacyId ?? r.parentRowId ?? 0,
  }));
}

/** Tag dengan jumlah post terbit. Arsipnya /tag/<slug>/, jadi path = slug. */
export async function listTags(): Promise<Term[]> {
  const rows = await getDb()
    .select({
      rowId: tags.id,
      legacyId: tags.legacyId,
      slug: tags.slug,
      name: tags.name,
      description: tags.description,
      count: sql<number>`count(${posts.id})::int`,
    })
    .from(tags)
    .leftJoin(postTags, eq(postTags.tagId, tags.id))
    .leftJoin(posts, and(eq(posts.id, postTags.postId), eq(posts.status, "published")))
    .groupBy(tags.id)
    .orderBy(tags.id);
  return rows.map((r) => ({ id: r.legacyId ?? r.rowId, slug: r.slug, path: r.slug, name: r.name, description: r.description, count: r.count, parent: 0 }));
}

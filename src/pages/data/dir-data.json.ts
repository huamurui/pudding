import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { generateDirectoryStructure } from '@/utils/helpers';

export const GET: APIRoute = async () => {
  const data = await  generateDirectoryStructure()
  const data_str = JSON.stringify(data);
  return new Response(data_str, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
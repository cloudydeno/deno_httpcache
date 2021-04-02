import type { S3Bucket } from "https://deno.land/x/s3@0.4.0/src/bucket.ts";
import { Cache } from "./mod.ts";
export { Cache };

export function s3Cache(
  s3: S3Bucket,
  prefix = "",
): Cache {

  function urlKey(url: string) {
    return prefix + url.replace('://', '/') + '.cache';
  }

  return new Cache({
    async get(url) {
      const data = await s3.getObject(urlKey(url));
      if (!data) return undefined;
      return {
        policy: JSON.parse(data.meta['cache-policy'] || '{}'),
        body: new Uint8Array(await new Response(data.body).arrayBuffer()),
      };
    },
    async set(url, resp) {
      const contentTypes = resp.policy.resh['content-type'] ?? [];
      await s3.putObject(urlKey(url), resp.body, {
        contentType: Array.isArray(contentTypes) ? contentTypes[0] : contentTypes,
        meta: {
          ['cache-policy']: JSON.stringify(resp.policy),
        },
      });
    },
    async delete(url) {
      await s3.deleteObject(urlKey(url));
    },
    close() {},
  });
}

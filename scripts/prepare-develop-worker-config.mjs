import { readFile, writeFile } from 'node:fs/promises';

const configPath = new URL('../dist/server/wrangler.json', import.meta.url);
const config = JSON.parse(await readFile(configPath, 'utf8'));

Object.assign(config, {
  name: 'blog-develop',
  routes: [{ pattern: 'develop.bluebirds.cloud', custom_domain: true }],
  d1_databases: [
    {
      binding: 'DB',
      database_name: 'blog-develop',
      database_id: '09020bc1-858f-4acc-8a8d-acb587897d34',
      migrations_dir: '../../db/migrations',
    },
  ],
  r2_buckets: [{ binding: 'MEDIA_BUCKET', bucket_name: 'bluebirds-media-develop' }],
  vars: {
    MEDIA_ACCESS_AUD: '385a95e44c1643ab0a9885b8cc572bfe89c09d61abc2c000235a190f9705c65e',
    MEDIA_PUBLIC_URL: 'https://media-develop.bluebirds.cloud',
    MEDIA_ACCESS_TEAM_DOMAIN: 'https://long-disk-2ff5.cloudflareaccess.com',
    MEDIA_ACCESS_EMAIL: 'jykim632@gmail.com',
  },
});

for (const key of ['configPath', 'userConfigPath', 'topLevelName', 'definedEnvironments']) {
  delete config[key];
}

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

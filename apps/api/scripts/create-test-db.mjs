// .env.test の DATABASE_URL が指すデータベースを作成する（既にあれば何もしない）。
// 接続先・DB名を .env.test から取り出すことで、.env.test を唯一の出所にする
// （ハードコードだとポート・認証情報を変えている環境で接続エラーになる）。
import { config } from 'dotenv';
import pg from 'pg';

const { error } = config({ path: new URL('../.env.test', import.meta.url) });
if (error) {
  console.error('apps/api/.env.test がありません。cp apps/api/.env.test.example apps/api/.env.test を実行してください');
  process.exit(1);
}

const testUrl = new URL(process.env.DATABASE_URL ?? '');
const dbName = testUrl.pathname.replace(/^\//, '');
if (!dbName) {
  throw new Error('apps/api/.env.test の DATABASE_URL に DB 名がありません');
}

// CREATE DATABASE は接続中のDBに対しては実行できないので、同じホストの postgres 管理DBに接続する
const adminUrl = new URL(testUrl);
adminUrl.pathname = '/postgres';
const client = new pg.Client({ connectionString: adminUrl.toString() });

await client.connect();
try {
  await client.query(`CREATE DATABASE "${dbName}"`);
  console.log(`${dbName} データベースを作成しました`);
} catch (err) {
  if (err && typeof err === 'object' && 'code' in err && err.code === '42P04') {
    console.log(`${dbName} データベースは既に存在します`);
  } else {
    throw err;
  }
} finally {
  await client.end();
}

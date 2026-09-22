// lt_test データベースを作成する（既にあれば何もしない）。
// 接続先は既存の lt データベース（docker-compose の db サービス）を admin 接続として使う。
import pg from 'pg';

const adminUrl = process.env.DATABASE_URL ?? 'postgresql://lt:lt@localhost:5432/lt';
const client = new pg.Client({ connectionString: adminUrl });

await client.connect();
try {
  await client.query('CREATE DATABASE lt_test');
  console.log('lt_test データベースを作成しました');
} catch (err) {
  if (err && typeof err === 'object' && 'code' in err && err.code === '42P04') {
    console.log('lt_test データベースは既に存在します');
  } else {
    throw err;
  }
} finally {
  await client.end();
}

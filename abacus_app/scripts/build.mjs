import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { build } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');

// ディレクトリ内の全ファイルを安全に削除する関数（OneDrive環境等でのロック対策）
function cleanDirectoryContents(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    try {
      if (entry.isDirectory()) {
        cleanDirectoryContents(fullPath);
        fs.rmdirSync(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.warn(`[Build Warning] Could not remove ${entry.name}:`, err.message);
    }
  }
}

async function main() {
  // 1. dist ディレクトリ内の既存成果物を自動クリーンアップ
  console.log('Cleaning dist directory contents...');
  cleanDirectoryContents(distDir);
  console.log('Dist directory cleaned successfully.');

  // 2. TypeScript 型チェック
  console.log('Running type-check...');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('Type-check passed (0 errors).');
  } catch (e) {
    console.error('Type-check failed:', e);
    process.exit(1);
  }

  // 3. Vite ビルド
  console.log('Running Vite build...');
  try {
    await build();
    console.log('Build completed successfully!');
  } catch (e) {
    console.error('Vite build failed:', e);
    process.exit(1);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Unhandled build error:', err);
  process.exit(1);
});


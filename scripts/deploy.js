// 部署脚本：将 dist 目录推送到 gh-pages 分支
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const repo = 'https://github.com/yaoyfgit/vds.git';

try {
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist 目录不存在，请先运行 npm run build');
    process.exit(1);
  }

  console.log('📦 复制 dist 目录到临时目录...');
  const tempDir = path.resolve('.gh-pages-temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  fs.cpSync(distDir, tempDir, { recursive: true });

  console.log('🔧 在临时目录初始化 git...');
  execSync('git init', { cwd: tempDir, stdio: 'inherit' });
  execSync('git checkout -b gh-pages', { cwd: tempDir, stdio: 'inherit' });
  execSync('git add .', { cwd: tempDir, stdio: 'inherit' });
  execSync('git config user.email "deploy@github.com"', { cwd: tempDir, stdio: 'inherit' });
  execSync('git config user.name "GitHub Actions"', { cwd: tempDir, stdio: 'inherit' });
  execSync('git commit -m "Deploy to GitHub Pages"', { cwd: tempDir, stdio: 'inherit' });

  console.log('🚀 推送到 gh-pages 分支...');
  execSync(`git push -f ${repo} gh-pages`, { cwd: tempDir, stdio: 'inherit' });

  console.log('🧹 清理临时目录...');
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log('✅ 部署成功！');
  console.log('🌐 访问地址: https://yaoyfgit.github.io/vds');
} catch (err) {
  console.error('❌ 部署失败:', err.message);
  process.exit(1);
}

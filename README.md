# 梅花易数 - AI 智能解卦系统

基于 Next.js 构建的现代化梅花易数解卦应用，结合 AI 大模型提供深度卦象解析。

## ✨ 特性

- 🎯 **传统梅花易数起卦算法** - 忠实还原古法起卦
- 🤖 **AI 智能解卦** - 支持 OpenAI、DeepSeek 等多种大模型
- 🎨 **优雅中国风界面** - 精心设计的视觉体验
- 📱 **响应式布局** - 完美支持桌面端和移动端
- 💾 **数据持久化** - 支持本地存储或 PostgreSQL 数据库
- 🔐 **管理后台** - 可选的后台管理面板，查看统计和记录
- ⚡ **高性能架构** - 基于 Next.js 14+ 构建

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone <your-repo-url>
cd meihua-yishu

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/meihua-yishu)

1. 推送代码到 GitHub
2. 在 [Vercel](https://vercel.com/new) 导入项目
3. 配置环境变量
4. 点击部署

## 🔧 环境变量配置

### 基础配置（必填）

| 变量名 | 必填 | 说明 | 示例值 |
|--------|------|------|--------|
| `OPENAI_API_KEY` | ✅ | AI API 密钥 | `sk-xxxxxxxx` |
| `OPENAI_BASE_URL` | ❌ | API 基础地址 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | ❌ | 使用的模型 | `gpt-3.5-turbo` |

### 数据库配置（可选）

启用数据库后，将解锁管理后台功能，可查看用户统计和占卜记录。

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串（推荐 Supabase） |
| `ADMIN_PASSWORD` | 管理后台登录密码 |
| `ADMIN_SESSION_SECRET` | Session 加密密钥（至少 32 字符） |

> **提示**：如不配置数据库，数据将存储在用户浏览器的 localStorage 中。

### 配置示例

**使用 OpenAI**
```env
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
```

**使用 DeepSeek**
```env
OPENAI_API_KEY=your-deepseek-api-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

**启用数据库和管理后台**
```env
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@pooler.supabase.com:5432/postgres
ADMIN_PASSWORD=your-secure-password
ADMIN_SESSION_SECRET=your-random-32-character-secret-key
```

## 🛠️ 管理后台

配置数据库后，访问 `/admin` 进入管理后台：

- 📊 **统计面板** - 查看用户数量、占卜次数等统计
- 📝 **记录管理** - 浏览和管理所有占卜记录
- ⚙️ **系统设置** - 自定义网站标题等配置

## 📚 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14+ (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| UI | Radix UI |
| 动画 | Framer Motion |
| 数据库 | PostgreSQL (可选) |
| AI | OpenAI 兼容 API |

## ⚡ 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 运行生产版本
npm run lint     # 代码检查
```

## 📖 使用说明

1. 在首页输入你想要占卜的问题
2. 输入两个数字（或使用随机生成）
3. 点击"起卦"按钮
4. 查看卦象和 AI 解析结果

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**注意**：本项目仅供娱乐和学习交流使用，请勿过度迷信。

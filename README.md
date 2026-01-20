# 太吾小游戏 Demo

受[《太吾绘卷》](https://store.steampowered.com/app/838350/_The_Scroll_Of_Taiwu/)启发的武侠文字游戏 Demo。采用极简夜读 MUD 风格界面。

[Scroll of Taiwu](https://store.steampowered.com/app/838350/_The_Scroll_Of_Taiwu/) inspired wuxia text game demo with minimalist night-reading MUD style.

## 游戏特性

- **角色养成** - 12项基础属性 (6组攻防对)，真气分配系统
- **功法系统** - 内功决定内力类型，催破/护体功法战斗施展
- **装备系统** - 武器/护甲随机抽取，品阶从凡品到绝世
- **产业经营** - 市集产出金钱，祠堂产出威望
- **回合制战斗** - 命中判定、内外伤计算、受伤标记机制

## 快速开始

```bash
# 克隆项目
git clone https://github.com/louy2/taiwu-mini-demo.git
cd taiwu-mini-demo/wuxia-game

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 开始游戏。

## 技术栈

| 类型 | 技术 |
|-----|------|
| 框架 | Vue 3 (Composition API + script setup) |
| 构建 | Vite 7 |
| 测试 | Vitest + @vue/test-utils |
| 存储 | LocalStorage (带版本迁移) |

## 项目结构

```
taiwu-mini-demo/
├── docs/design.md       # 游戏设计文档
├── CLAUDE.md            # AI 开发助手指南
├── CHANGELOG.md         # 变更日志
└── wuxia-game/          # Vue 项目
    ├── src/
    │   ├── gameLogic.js # 核心游戏逻辑
    │   ├── App.vue      # 主界面
    │   └── data/        # 功法/装备数据
    └── tests/           # 单元测试
```

## 开发命令

```bash
cd wuxia-game
npm run dev      # 开发服务器
npm run build    # 生产构建
npm run test     # 运行测试
npm run preview  # 预览构建结果
```

## 文档

- [游戏设计文档](docs/design.md) - 完整的游戏机制设计
- [开发指南](CLAUDE.md) - 代码架构与开发任务指南
- [变更日志](CHANGELOG.md) - 版本更新记录

## License

MIT

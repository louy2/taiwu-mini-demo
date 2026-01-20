# wuxia-game

太吾小游戏 Vue 项目。

## 开发命令

```bash
npm install      # 安装依赖
npm run dev      # 开发服务器 (http://localhost:5173)
npm run build    # 生产构建
npm run preview  # 预览构建结果
npm run test     # 运行测试
```

## 目录结构

```
src/
├── main.js           # Vue 入口
├── App.vue           # 主界面组件
├── gameLogic.js      # 核心游戏逻辑
├── components/
│   └── CombatView.vue  # 战斗界面组件
├── data/
│   ├── kungfu.js     # 功法数据定义
│   └── items.js      # 装备数据定义
├── utils/
│   └── storage.js    # 存档管理
└── tests/            # 单元测试
```

## 技术栈

- Vue 3 (Composition API + `<script setup>`)
- Vite 7
- Vitest + @vue/test-utils

## 相关文档

- [游戏设计文档](../docs/design.md)
- [开发指南](../CLAUDE.md)

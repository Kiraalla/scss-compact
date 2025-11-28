# 更新日志

## [0.0.6] - 2025-11-28

### 新增
- 添加了注释保留配置选项 `preserveComments`，可以选择在输出的CSS中保留注释
- 添加了 `removeCharset` 配置选项，可以移除输出CSS中的 `@charset` 声明（默认启用）
- 注释现在会单独占一行，提高可读性

### 优化
- 移除了未使用的 chokidar 依赖
- 优化了文件监听逻辑，避免重复编译
- 清理了冗余代码，提升性能
- 改进了注释格式化逻辑，使用占位符机制确保注释正确处理

### 修复
- 修复了 `preserveComments` 配置不生效的问题，现在可以正确保留注释
- 修复了注释与CSS规则混在一起的问题

### 技术改进
- 使用占位符机制处理注释，避免格式化过程中注释丢失或错位
- 根据 `preserveComments` 配置动态选择 Sass 编译样式（expanded/compressed）

## [0.0.5] - 2025-07-12

### 新增
- 添加了CSS输出后缀配置功能
- 通过outputExtension配置项，可以自定义CSS输出后缀

## [0.0.4] - 2025-05-26

### 新增
- 添加了CSS输出路径配置功能
- 支持三种输出路径模式：原目录、自定义目录和相对路径结构

## [0.0.3] - 2025-03-14

### 新增
- 添加了CSS输出格式配置选项，可选择紧凑或展开格式

## [0.0.2] - 2025-03-13

### 新增
- 添加了对下划线文件的忽略选项

### 修复
- 修复了一些小问题

## [0.0.1] - 2025-03-12

### 新增
- 初始版本发布
- 基本的SCSS/SASS编译功能
- 紧凑的CSS格式化
- 保存时自动编译功能


---

## 项目链接

- **GitHub 仓库**: https://github.com/Kiraalla/scss-compact
- **VSCode 市场**: https://marketplace.visualstudio.com/items?itemName=kira0522.scss-compact
- **问题反馈**: https://github.com/Kiraalla/scss-compact/issues

## 贡献指南

欢迎提交 Pull Request 或 Issue！如果你有任何建议或发现了 bug，请在 GitHub 上告诉我们。

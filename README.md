# SCSS Compact

一个用于将SCSS/SASS文件编译为CSS并采用紧凑格式的VSCode扩展。

## 扩展信息(https://marketplace.visualstudio.com/items?itemName=kira0522.scss-compact)

## 功能特点

- 保存时自动将SCSS/SASS文件编译为CSS
- 以紧凑风格格式化CSS输出
- 支持SASS编译的自定义包含路径

## 系统要求

- Visual Studio Code ^1.98.0

## 扩展设置

此扩展提供以下设置项：

* `scss-compact.autoCompile`：启用/禁用保存时自动编译（默认值：true）
* `scss-compact.includePaths`：SCSS/SASS编译的额外包含路径，用于指定@import或@use引入的SCSS模块的查找路径
* `scss-compact.outputCompact`：将CSS输出为紧凑格式，设为false则输出为展开格式（默认值：true）
* `scss-compact.outputPath`：CSS文件的输出路径，留空则输出到与SCSS/SASS文件相同的目录
* `scss-compact.outputPathFormat`：输出路径格式，可选值：
  - `same`：与源文件相同目录（默认值）
  - `custom`：使用自定义输出目录（由outputPath指定）
  - `relative`：保持相对路径结构但使用不同的根目录（由outputPath指定）



          
### outputPathFormat 配置的设计思考

`outputPathFormat` 这个配置项的设计考虑了实际项目中常见的几种CSS输出需求场景：

#### 1. same（默认模式）

这是最简单的模式，编译后的CSS文件与SCSS文件位于相同目录。适用场景：
- 小型项目，文件结构简单
- 希望源文件和编译后的文件保持在一起，便于管理
- 不需要特别的资源组织结构

#### 2. custom（自定义目录模式）

所有编译后的CSS文件都会被放置在指定的目录中。适用场景：
- 需要将所有CSS文件集中管理
- 前后端分离项目，需要将编译后的CSS文件放在特定的静态资源目录
- 构建过程中需要将CSS文件统一收集到发布目录

例如，可以配置：
```json
{
  "scss-compact.outputPath": "dist/css",
  "scss-compact.outputPathFormat": "custom"
}
```
这样所有的CSS文件都会被输出到 `dist/css` 目录下。

#### 3. relative（相对路径模式）

这是最灵活的模式，它会在新的根目录下保持原有的目录结构。适用场景：
- 大型项目，有复杂的目录结构
- 需要保持源文件的组织结构，但想将CSS文件放在不同的根目录
- 多页面应用，需要保持资源的相对位置关系

例如，如果你的项目结构是：
```
src/
  components/
    header/
      style.scss
    footer/
      style.scss
```

1.配置：
```json
{
  "scss-compact.outputPath": "dist/styles",
  // 或
  // "scss-compact.outputPath": "./dist/styles",
  "scss-compact.outputPathFormat": "relative"
}
```

编译后会生成：
```
dist/
  styles/
    components/
      header/
        style.css
      footer/
        style.css
```
2.配置：
```json
{
  "scss-compact.outputPath": "/styles",
  "scss-compact.outputPathFormat": "relative"
}
```
编译后会生成：
```
D:/
  styles/
    components/
      header/
        style.css
      footer/
        style.css
```
3.配置：
```json
{
  "scss-compact.outputPath": "../styles",
  "scss-compact.outputPathFormat": "relative"
}
```

编译后会生成：
```

styles/
  <project_root>/
    components/
      header/
        style.css
      footer/
        style.css
```
#### 技术实现细节

1. 在 `relative` 模式下，扩展会：
   - 计算SCSS文件相对于工作区的路径
   - 在新的输出根目录下重建这个路径结构
   - 自动创建所需的目录结构

2. 所有模式都会自动处理：
   - 目录不存在时的创建
   - 文件名的保持（仅改变扩展名）
   - 路径分隔符的跨平台兼容

这种设计让用户可以根据项目的具体需求选择最合适的输出方式，既保证了简单场景下的易用性，又满足了复杂项目的定制需求。
        

## 使用方法

1. 安装扩展
2. 打开SCSS/SASS文件
3. 保存文件以自动编译为CSS，或使用命令"SCSS Compact: Compile SCSS/SASS to CSS"

## 已知问题

目前暂无已知问题。

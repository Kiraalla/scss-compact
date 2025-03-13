import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import * as sass from 'sass';
import * as vscode from 'vscode';

let watcher: chokidar.FSWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
  // 注册编译命令
  let disposable = vscode.commands.registerCommand('scss-compact.compile', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      compileSassFile(editor.document.uri.fsPath);
    }
  });

  context.subscriptions.push(disposable);

  // 监听文件保存事件
  vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
    if (document.languageId === 'scss' || document.languageId === 'sass') {
      const config = vscode.workspace.getConfiguration('scss-compact');
      if (config.get('autoCompile')) {
        compileSassFile(document.uri.fsPath);
      }
    }
  }, null, context.subscriptions);

  // 启动文件监听
  startFileWatcher();
}

export function deactivate() {
  if (watcher) {
    watcher.close();
  }
}

function startFileWatcher() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return;
  }

  workspaceFolders.forEach(folder => {
    const pattern = new vscode.RelativePattern(folder, '**/*.{scss,sass}');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    watcher.onDidChange(uri => {
      const config = vscode.workspace.getConfiguration('scss-compact');
      if (config.get('autoCompile')) {
        compileSassFile(uri.fsPath);
      }
    });
  });
}

function compileSassFile(filePath: string) {
  try {
    const config = vscode.workspace.getConfiguration('scss-compact');
    const includePaths = config.get<string[]>('includePaths') || [];
    const ignoreUnderscoreFiles = config.get<boolean>('ignoreUnderscoreFiles');

    // 检查文件名是否以下划线开头
    const fileName = path.basename(filePath);
    if (ignoreUnderscoreFiles && fileName.startsWith('_')) {
      return;
    }

    const result = sass.compile(filePath, {
      style: 'compressed',
      loadPaths: includePaths
    });

    // 将编译后的CSS转换为Compact格式
    const compactCss = formatCompact(result.css);

    // 生成输出文件路径
    const outputPath = filePath.replace(/\.(scss|sass)$/, '.css');

    // 写入文件
    fs.writeFileSync(outputPath, compactCss);

    vscode.window.showInformationMessage(`已成功编译 ${path.basename(filePath)}`);
  } catch (error) {
    vscode.window.showErrorMessage(`编译失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function formatCompact(css: string): string {
  // 移除多余的空白和注释
  css = css.replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, '');
  css = css.replace(/[\n\r\t]+/g, '');
  css = css.replace(/\s*([{}:;,])\s*/g, '$1');

  // 在选择器之间添加换行
  css = css.replace(/}/g, '}\n');

  // 在每个规则块内部保持属性在同一行
  css = css.replace(/{([^}]+)}/g, (match, properties) => {
    properties = properties.trim();
    if (!properties) {
      return '{}\n';
    }

    const formattedProperties = properties
      .split(';')
      .filter((prop: string) => prop.trim())
      .map((prop: string) => prop.trim())
      .join('; ');

    return `{ ${formattedProperties} }`;
  });

  return css.trim();
}

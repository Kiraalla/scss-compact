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
    const outputCompact = config.get<boolean>('outputCompact') ?? true;
    let outputPath = config.get<string>('outputPath') || '';
    const outputPathFormat = config.get<string>('outputPathFormat') || 'same';

    // 检查文件名是否以下划线开头
    const fileName = path.basename(filePath);
    if (ignoreUnderscoreFiles && fileName.startsWith('_')) {
      return;
    }

    const result = sass.compile(filePath, {
      style: 'compressed',
      loadPaths: includePaths
    });

    // 根据配置决定是否使用紧凑格式
    const outputCss = outputCompact ? formatCompact(result.css) : formatExpanded(result.css);

    // 生成输出文件路径
    let finalOutputPath = '';
    const fileExtension = path.extname(filePath);
    const fileNameWithoutExt = path.basename(filePath, fileExtension);
    
    switch (outputPathFormat) {
      case 'same':
        // 默认行为：输出到相同目录
        finalOutputPath = filePath.replace(/\.(scss|sass)$/, '.css');
        break;
      
      case 'custom':
        // 自定义输出目录
        if (outputPath) {
          let targetOutputPath;
          if (path.isAbsolute(outputPath)) {
            // 如果是绝对路径，直接使用
            targetOutputPath = outputPath;
          } else {
            // 如果是相对路径，基于当前文件所在目录
            targetOutputPath = path.join(path.dirname(filePath), outputPath);
          }
          // 确保输出目录存在
          if (!fs.existsSync(targetOutputPath)) {
            fs.mkdirSync(targetOutputPath, { recursive: true });
          }
          finalOutputPath = path.join(targetOutputPath, `${fileNameWithoutExt}.css`);
        } else {
          // 如果未设置输出路径，回退到默认行为
          finalOutputPath = filePath.replace(/\.(scss|sass)$/, '.css');
        }
        break;
      
      case 'relative':
        // 保持相对路径结构但使用不同的根目录
        if (outputPath) {
          let targetOutputPath;
          if (path.isAbsolute(outputPath)) {
            // 如果是绝对路径，直接使用
            targetOutputPath = outputPath;
          } else {
            // 处理以/开头的相对路径
            if (outputPath.startsWith('/')) {
              outputPath = outputPath.substring(1);
            }
            // 基于工作区根目录
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
            if (workspaceFolder) {
              targetOutputPath = path.join(workspaceFolder.uri.fsPath, outputPath);
              // 确保输出目录存在
              if (!fs.existsSync(targetOutputPath)) {
                fs.mkdirSync(targetOutputPath, { recursive: true });
              }
            } else {
              // 如果无法确定工作区，回退到默认行为
              return filePath.replace(/\.(scss|sass)$/, '.css');
            }
          }

          // 获取工作区文件夹
          const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
          if (workspaceFolder) {
            // 计算文件相对于工作区的路径
            const relativePath = path.relative(workspaceFolder.uri.fsPath, path.dirname(filePath));
            // 组合新的输出路径
            const newOutputDir = path.join(targetOutputPath, relativePath);
            // 确保输出目录存在
            if (!fs.existsSync(newOutputDir)) {
              fs.mkdirSync(newOutputDir, { recursive: true });
            }
            finalOutputPath = path.join(newOutputDir, `${fileNameWithoutExt}.css`);
          } else {
            // 如果无法确定工作区，回退到默认行为
            finalOutputPath = filePath.replace(/\.(scss|sass)$/, '.css');
          }
        } else {
          // 如果未设置输出路径，回退到默认行为
          finalOutputPath = filePath.replace(/\.(scss|sass)$/, '.css');
        }
        break;
      
      default:
        // 默认行为
        finalOutputPath = filePath.replace(/\.(scss|sass)$/, '.css');
    }

    // 确保输出文件的目录存在
    const outputDir = path.dirname(finalOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(finalOutputPath, outputCss);

    vscode.window.showInformationMessage(`已成功编译 ${path.basename(filePath)} 到 ${finalOutputPath}`);
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

function formatExpanded(css: string): string {
  // 移除多余的空白和注释
  css = css.replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, '');
  css = css.replace(/[\n\r\t]+/g, '');
  css = css.replace(/\s*([{}:;,])\s*/g, '$1');

  // 在选择器之间添加换行
  css = css.replace(/}/g, '}\n\n');

  // 在每个规则块内部格式化属性
  css = css.replace(/{([^}]+)}/g, (match, properties) => {
    properties = properties.trim();
    if (!properties) {
      return '{}\n';
    }

    const formattedProperties = properties
      .split(';')
      .filter((prop: string) => prop.trim())
      .map((prop: string) => `\n    ${prop.trim()}`)
      .join(';');

    return `{${formattedProperties}\n}`;
  });

  return css.trim();
}

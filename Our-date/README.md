# 专属约会邀请页

这是一个手机端优先的静态网页项目。适合部署后把链接发给对方，对方可以：

- 选择约会活动
- 选择日期和时间
- 填写小要求
- 生成确认卡片
- 通过微信/系统分享把选择发回来
- 下载 `.ics` 文件加入手机日历

## 1. 修改名字和文案

用记事本、VS Code 或 PyCharm 打开 `config.js`，修改：

```js
fromName: "a",
toName: "特别的你",
openingText: "不是群发……"
```

也可以在 `activities` 中修改活动内容。

## 2. 本地预览

最简单的方法：直接双击 `index.html`。

推荐方式：在项目目录打开终端，运行：

```bash
python -m http.server 8080
```

然后浏览器打开：

```text
http://localhost:8080
```

## 3. 免费部署到 GitHub Pages

1. 在 GitHub 新建一个公开仓库，例如 `our-date`。
2. 把本文件夹中的 5 个文件上传到仓库根目录。
3. 打开仓库 `Settings` → `Pages`。
4. `Build and deployment` 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`，点击保存。
6. 等待页面生成后，把网址发给对方。

## 4. 当前版本的数据方式

这是无需服务器的版本。对方确认后，可点“把选择发给 TA”，通过微信或复制文本把结果发给你。

如需“对方提交后，你能在后台直接查看”，可升级为 Supabase/Firebase 后端版本。

## 5. 项目文件

- `index.html`：页面结构
- `style.css`：界面与动画
- `config.js`：姓名、文案、活动和时间配置
- `app.js`：选择流程、分享与日历功能

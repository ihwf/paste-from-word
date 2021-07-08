# paste from word

粘贴 Word 文档内容到任何富文本编辑器

Paste from Microsoft Word without loosing any formatting for all rich text editor.

## 浏览器兼容性

兼容常见的 PC 浏览器：Chrome，Firefox，Edge，QQ 浏览器，IE11 。

🚧 不支持 MacOS 的浏览器。
🚧 Not Support MacOS

## 基本使用

npm 安装 `npm i paste-from-word --save`

```js
import pasteFromWord from 'paste-from-word'
const paster = new pasteFromWord()
paster.parse(e, function (res) {
    // do something with HTML
    console.log(res) // {html: '<p>paste-from-word</p>', text: 'paste-from-word'}
})
```

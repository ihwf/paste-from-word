# paste from word for all rich text editors

粘贴 Word 文档内容到任何富文本编辑器, 完美支持多图文. 很多富文本编辑器不能直接粘贴从 word 文档复制的图片, 本插件可以解决这个问题. 适用于所有的富文本编辑器.

Paste from Microsoft Word without loosing any formatting for all rich text editor, support multi image and text.

## 浏览器兼容性

兼容常见的 PC 浏览器：Chrome，Firefox，Edge，QQ 浏览器，IE11 。

🚧 MacOS 的浏览器不支持粘贴 word 文档内的图片。
🚧 MacOS browser Not Support paste image from Microsoft Word

## 基本使用

npm 安装 `npm i paste-from-word --save`

```js
import pasteFromWord from 'paste-from-word'
const paster = new pasteFromWord({
    // optional. Processing images function, the option blob is image blob, you can do something with the blob,like upload to server.And the option next is a function to put the image link to HTML string
    // 可选项, 图片处理函数, 每一张图片都会调用此函数, 参数 blob 为图片的 blob 对象, 可以用于上传到服务器,获取到图片在服务器上的链接后, 调用 next 方法会自动回填到 HTML 字符串中
    imageHandler: function (blob, next) {
        upload(blob).then(function (response) {
            next(response.imageUrl)
        })
    },
    // optional. If this option set true, will ignore paste single image or file. Default is false
    // 可选项. 是否忽略粘贴单张图片(剪贴板中只有一张图片), 默认为 false
    ignorePasteSingleFile: true, // true/false
})

const target = document.querySelector('div.target-editor')

targetEditor.addEventListener('paste', pasteEvent => {
    paster.parse(pasteEvent, function (res) {
        // do something with paste HTML, like insert to editor
        console.log(res) // {html: '<p>paste-from-word</p>', text: 'paste-from-word'}
    })
})
```

import tools from './tools'

class PasteFromWord {
    constructor(config) {
        this.config = config || {}
    }
    get supportedImageTypes() {
        return ['image/png', 'image/jpeg', 'image/gif']
    }
    /**
     * 运行解析器
     * @param pasteEvent 粘贴事件
     * @returns
     */
    parse(pasteEvent, next) {
        const clipboardData = pasteEvent.clipboardData || window.clipboardData
        this.parser(clipboardData, next)
    }
    /**
     * 检查是否是 word 文档数据
     * @param {String} paster 检测的数据
     * @returns {Boolean} 是否是 word 文档数据
     */
    checkPaster(paster) {
        const mswordHtml = this.getClipboardData(paster, 'text/html')
        const generatorName = this.getContentGeneratorName(mswordHtml)
        const wordRegexp = /(class="?Mso|style=["'][^"]*?\bmso\-|w:WordDocument|<o:\w+>|<\/font>)/ // eslint-disable-line
        const isOfficeContent = generatorName
            ? generatorName === 'microsoft'
            : wordRegexp.test(mswordHtml)

        return mswordHtml && isOfficeContent
    }
    /**
     * 从传入的剪贴版数据中获取指定类型的数据
     * @param {Object} data 剪贴版数据
     * @param {String} type 类型: html/rtf
     * @returns {String} 指定类型的数据
     */
    getClipboardData(data, type) {
        return data.getData(type)
    }
    /**
     * 识别传入的内容是文档编辑器创建的
     * 如果传入的内容中不存在 `<meta>` 标签，则返回 `undefined`。
     * 如果 `<meta>` 标签的值不是 `'microsoft'` 或 `'libreoffice'` ，则返回 `'unknown'`。
     * @param {String} content 剪贴板数据.
     * @returns {String/undefined} 文档编辑器名称。可能的值：“microsoft”、“libreoffice”、“unknown”、“undefiend”。
     */
    getContentGeneratorName(content) {
        const metaGeneratorTag = /<meta\s+name=["']?generator["']?\s+content=["']?(\w+)/gi
        const result = metaGeneratorTag.exec(content)

        if (!result || !result.length) {
            return
        }

        const generatorName = result[1].toLowerCase()

        if (generatorName.indexOf('microsoft') === 0) {
            return 'microsoft'
        }

        if (generatorName.indexOf('libreoffice') === 0) {
            return 'libreoffice'
        }

        return 'unknown'
    }
    /**
     * 解析器
     * @param paster 粘贴板数据
     * @param next 粘贴完后的回调函数
     */
    parser(paster, next) {
        const mswordHtml = this.stripHtml(this.getClipboardData(paster, 'text/html'))
        const plain = this.getClipboardData(paster, 'text/plain')
        const file = paster.files[0]
        const dataTransferRtf = this.getClipboardData(paster, 'text/rtf')
        const pfwEvtData = {
            html: mswordHtml,
            text: plain,
            // rtf: dataTransferRtf,
        }

        if (file && !this.config.ignorePasteSingleFile) {
            this.handleSingleFile(file).then(function (res) {
                pfwEvtData.html = res
                next(pfwEvtData)
            })
        } else {
            // 从 rtf 数据中提取图片替换到 html 数据中
            this.filterRtfImageToHtml(pfwEvtData.html, dataTransferRtf).then(function (res) {
                pfwEvtData.html = res || plain
                next(pfwEvtData)
            })
        }
    }
    /**
     * 处理 HTML 字符串, 移除所有多余的字符
     * This function removes this meta information and returns only the contents of the `<body>` element if found.
     * Various environments use miscellaneous meta tags in HTML clipboard, e.g.
     *
     * * `<meta http-equiv="content-type" content="text/html; charset=utf-8">` at the begging of the HTML data.
     * * Surrounding HTML with `<!--StartFragment-->` and `<!--EndFragment-->` nested within `<html><body>` elements.
     *
     * @param {String} html
     * @returns {String}
     */
    stripHtml(html) {
        let result = html
        const metaRegExp = /^<meta.*?>/i
        const bodyRegExp = /<body(?:[\s\S]*?)>([\s\S]*)<\/body>/i
        const fragmentRegExp = /\s*<!--StartFragment-->|<!--EndFragment-->\s*/g

        if (result && result.length) {
            result = result.replace(metaRegExp, '')

            // Keep only contents of the <body> element
            var match = bodyRegExp.exec(result)
            if (match && match.length) {
                result = match[1]

                // Remove also comments.
                result = result.replace(fragmentRegExp, '')
            }
        }

        return result
    }
    /**
     * 从 rtf 数据中提取图片替换到 html 数据中
     * @param html
     * @param rtf
     * @returns {String} html 处理后的 html 字符串
     */
    filterRtfImageToHtml(html, rtf) {
        // 从 HTML 中获取所有图片链接
        const imgTags = this.extractTagsFromHtml(html)

        if (imgTags.length === 0) {
            return Promise.resolve(html)
        }

        if (rtf) {
            return this.handleRtfImages(html, rtf, imgTags)
        }

        return this.handleBlobImages(html, imgTags)
    }
    /**
     * 从 html 中提取图片链接
     * @param {String} html 需要提取图片链接的 html 字符串
     * @returns {Array} 所有图片链接
     */
    extractTagsFromHtml(html) {
        const regexp = /<img[^>]+src="([^"]+)[^>]+/g
        const ret = []
        let item

        while ((item = regexp.exec(html))) {
            ret.push(item[1])
        }

        return ret
    }
    /**
     * 从 rtf 数据中提取图片数据替换到 html 数据中
     * @param {String} html 要替换图片数据的 html 字符串
     * @param {String} rtf rtf 字符串
     * @param {Array} imgTags html 字符串中所有图片的链接
     * @returns {Promise} 回传参数为处理后的 html 字符串
     */
    handleRtfImages(html, rtf, imgTags) {
        const self = this
        const hexImages = this.extractFromRtf(rtf)
        return new Promise(function (resolve) {
            let promises
            if (hexImages.length === 0) {
                resolve(html)
            }

            if (self.config.imageHandler) {
                promises = tools.map(hexImages, self.imageHandlerWrapper, self)
            } else {
                promises = tools.map(
                    hexImages,
                    function (img) {
                        return Promise.resolve(self.createSrcWithBase64(img))
                    },
                    self
                )
            }

            Promise.all(promises).then(function (newSrcValues) {
                if (imgTags.length !== newSrcValues.length) {
                    console.error('处理rtf图片异常!处理后的图片数量与处理前不一致', {
                        rtf: hexImages.length,
                        html: imgTags.length,
                    })

                    resolve(html)
                }

                // Assuming there is equal amount of Images in RTF and HTML source, so we can match them accordingly to the existing order.
                for (let i = 0; i < imgTags.length; i++) {
                    // Replace only `file` urls of images ( shapes get newSrcValue with null ).
                    if (imgTags[i].indexOf('file://') === 0) {
                        if (!newSrcValues[i]) {
                            console.error('处理后的图片中未找到第' + (i + 1) + '张图片', {
                                type: hexImages[i].type,
                                index: i,
                            })

                            continue
                        }

                        // In Word there is a chance that some of the images are also inserted via VML.
                        // This regex ensures that we replace only HTML <img> tags.
                        // Oh, and there are also Windows paths that need to be escaped
                        // before passing to regex.
                        const escapedPath = imgTags[i].replace(/\\/g, '\\\\')
                        const imgRegex = new RegExp('(<img [^>]*src=["\']?)' + escapedPath)

                        html = html.replace(imgRegex, '$1' + newSrcValues[i])
                    }
                }

                resolve(html)
            })
        })
    }
    /**
     * 处理 HTML 字符串中 blob 链接的图片
     * @param {String} html HTML 字符串
     * @param {Array} imgTags 从 HTML 字符串中提取出的所有图片链接
     * @returns {Promise} 回传参数为处理后的 HTML 字符串
     */
    handleBlobImages(html, imgTags) {
        const blobUrls = tools.unique(
            tools.filter(imgTags, function (imgTag) {
                return imgTag.match(/^blob:/i)
            })
        )
        const promises = tools.map(blobUrls, this.convertBlobUrlToBase64.bind(this))

        return new Promise(function (resolve) {
            Promise.all(promises).then(function (dataUrls) {
                tools.forEach(dataUrls, function (dataUrl, i) {
                    if (!dataUrl) {
                        console.error('转换blob格式图片为base64格式异常', {
                            type: 'blob',
                            index: i,
                        })
                        return
                    }
                    const blob = blobUrls[i]
                    html = html.replace(new RegExp(blob, 'g'), dataUrl)
                })
                resolve(html)
            })
        })
    }
    /**
     * 从 rtf 提取图片原始数据
     * @param rtfContent rtf 字符串
     * @returns {Array} 图片原始数据
     */
    extractFromRtf(rtfContent) {
        const ret = []

        // Remove headers, footers, non-Word images and drawn objects.
        // Headers and footers are in \header* and \footer* groups,
        // non-Word images are inside \nonshp groups.
        // Drawn objects are inside \shprslt and could be e.g. image alignment.
        rtfContent = tools.removeGroups(
            rtfContent,
            '(?:(?:header|footer)[lrf]?|nonshppict|shprslt)'
        )
        const wholeImages = tools.getGroups(rtfContent, 'pict')

        if (!wholeImages) {
            return ret
        }

        for (let i = 0; i < wholeImages.length; i++) {
            const currentImage = wholeImages[i].content
            const imageId = getImageId(currentImage)
            const imageType = getImageType(currentImage)
            const imageDataIndex = getImageIndex(imageId)
            const isAlreadyExtracted = imageDataIndex !== -1 && ret[imageDataIndex].hex
            // If the same image is inserted more then once, the same id is used.
            const isDuplicated = isAlreadyExtracted && ret[imageDataIndex].type === imageType
            // Sometimes image is duplicated with another format, especially if
            // it's right after the original one (so, in other words, original is the last image extracted).
            const isAlternateFormat =
                isAlreadyExtracted &&
                ret[imageDataIndex].type !== imageType &&
                imageDataIndex === ret.length - 1
            // WordArt shapes are defined using \defshp control word. Thanks to that
            // they can be easily filtered.
            const isWordArtShape = currentImage.indexOf('\\defshp') !== -1
            const isSupportedType = tools.indexOf(this.supportedImageTypes, imageType) !== -1

            if (isDuplicated) {
                ret.push(ret[imageDataIndex])

                continue
            }

            if (isAlternateFormat || isWordArtShape) {
                continue
            }

            var newImageData = {
                id: imageId,
                hex: isSupportedType ? getImageContent(currentImage) : null,
                type: imageType,
            }

            if (imageDataIndex !== -1) {
                ret.splice(imageDataIndex, 1, newImageData)
            } else {
                ret.push(newImageData)
            }
        }

        return ret

        function getImageIndex(id) {
            // In some cases LibreOffice does not include ids for images.
            // In that case, always treat them as unique (not found in the array).
            if (typeof id !== 'string') {
                return -1
            }

            return tools.indexOf(ret, function (image) {
                return image.id === id
            })
        }

        function getImageId(image) {
            const blipUidRegex = /\\blipuid (\w+)\}/
            const blipTagRegex = /\\bliptag(-?\d+)/
            const blipUidMatch = image.match(blipUidRegex)
            const blipTagMatch = image.match(blipTagRegex)

            if (blipUidMatch) {
                return blipUidMatch[1]
            } else if (blipTagMatch) {
                return blipTagMatch[1]
            }

            return null
        }

        // Image content is basically \pict group content. However RTF sometimes
        // break content into several lines and we don't want any whitespace
        // in our images. So we need to get rid of it.
        function getImageContent(image) {
            const content = tools.extractGroupContent(image)

            return content.replace(/\s/g, '')
        }
        /**
         * 获取图片格式
         * @param {String} imageContent 图片信息
         * @returns {String} 图片格式
         */
        function getImageType(imageContent) {
            const tests = [
                {
                    marker: /\\pngblip/,
                    type: 'image/png',
                },

                {
                    marker: /\\jpegblip/,
                    type: 'image/jpeg',
                },

                {
                    marker: /\\emfblip/,
                    type: 'image/emf',
                },

                {
                    marker: /\\wmetafile\d/,
                    type: 'image/wmf',
                },
            ]
            const extractedType = tools.find(tests, function (test) {
                return test.marker.test(imageContent)
            })

            if (extractedType) {
                return extractedType.type
            }

            return 'unknown'
        }
    }
    /**
     * 将图片信息创建为 base64 图片
     * @param {Object}} img 图片信息, {type, hex}, hex 为图片原始 16 进制数据
     * @returns {String} base64 格式图片
     */
    createSrcWithBase64(img) {
        const isSupportedType = tools.indexOf(this.supportedImageTypes, img.type) !== -1
        let data = img.hex

        if (!isSupportedType) {
            return null
        }

        if (typeof data === 'string') {
            data = tools.convertHexStringToBytes(img.hex)
        }

        return img.type ? 'data:' + img.type + ';base64,' + tools.convertBytesToBase64(data) : null
    }
    /**
     * 将 blob 链接转换为 base64 格式
     * @param {String} blobUrlSrc blob 链接
     * @returns {Promise} 回传参数为 base64 格式图片
     */
    convertBlobUrlToBase64(blobUrlSrc) {
        const self = this
        return new Promise(function (resolve) {
            tools.load(
                blobUrlSrc,
                function (arrayBuffer) {
                    const data = new Uint8Array(arrayBuffer)
                    const imageType = tools.getImageTypeFromSignature(data)
                    const img = {
                        type: imageType,
                        hex: data,
                    }

                    if (self.config.imageHandler) {
                        self.imageHandlerWrapper(img).then(resolve)
                    } else {
                        const base64 = self.createSrcWithBase64(img)
                        resolve(base64)
                    }
                },
                'arraybuffer'
            )
        })
    }
    /**
     * 通过图片信息创建 Blob 对象
     * @param {Object} img 图片信息, {type, hex}, hex 为图片原始 16 进制数据
     * @returns {Blob} Blob 对象
     */
    createBlobWithImageInfo(img) {
        const isSupportedType = tools.indexOf(this.supportedImageTypes, img.type) !== -1
        let data = img.hex

        if (!isSupportedType) {
            return null
        }

        if (typeof data === 'string') {
            data = tools.convertHexStringToBytes(img.hex)
        }
        var ab = new ArrayBuffer(data.length)
        var ia = new Uint8Array(ab)

        for (var i = 0; i < data.length; i++) {
            ia[i] = data[i]
        }

        const blob = new Blob([ia], { type: img.type })
        return blob
    }
    /**
     * 自定义图片处理 promise 化
     * @param {Object} img 图片信息 {type,hex}, hex 为图片原始 16 进制数据
     * @returns {Promise}
     */
    imageHandlerWrapper(img) {
        const self = this
        return new Promise(function (resolve) {
            self.config.imageHandler(self.createBlobWithImageInfo(img), resolve)
        })
    }
    /**
     * 处理粘贴文件
     * @param {File} file file 文件对象
     * @returns {Promise}
     */
    handleSingleFile(file) {
        const self = this
        return new Promise(function (resolve) {
            const supportType = tools.indexOf(self.supportedImageTypes, file.type) !== -1
            if (self.config.imageHandler) {
                const blob = new Blob([file], { type: file.type })
                self.config.imageHandler(blob, function (result) {
                    // TODO 考虑是否添加一个除了图片之外的其他文件的处理
                    result = supportType ? `<img src="${result}" />` : result
                    resolve(result)
                })
            } else {
                const fileReader = new FileReader() // 文件解读器

                fileReader.onloadend = function () {
                    const result = supportType
                        ? `<img src="${fileReader.result}" />`
                        : fileReader.result
                    resolve(result)
                }
                fileReader.onerror = function (err) {
                    console.error(err)
                }

                fileReader.readAsDataURL(file) // 读取一个文件返回base64地址
            }
        })
    }
}

export default PasteFromWord

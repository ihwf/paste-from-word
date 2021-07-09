const dataTools = {
    /**
     * Merges two objects and returns the new one.
     *
     *		var obj1 = {
     *				a: 1,
     *				conflicted: 10,
     *				obj: {
     *					c: 1
     *				}
     *			},
     *			obj2 = {
     *				b: 2,
     *				conflicted: 20,
     *				obj: {
     *					d: 2
     *				}
     *			};
     *
     *		dataTools.merge( obj1, obj2 );
     *
     * This code produces the following object:
     *
     *		{
     *			a: 1,
     *			b: 2,
     *			conflicted: 20,
     *			obj: {
     *				c: 1,
     *				d: 2
     *			}
     *		}
     *
     * @param {Object} obj1 The source object which will be used to create a new base object.
     * @param {Object} obj2 An object whose properties will be merged into the base one.
     * @returns {Object} The merged object.
     */
    merge: function (obj1, obj2) {
        var copy1 = dataTools.clone(obj1)
        var copy2 = dataTools.clone(obj2)

        dataTools.forEach(Object.keys(copy2), function (key) {
            if (typeof copy2[key] === 'object' && typeof copy1[key] === 'object') {
                copy1[key] = dataTools.merge(copy1[key], copy2[key])
            } else {
                copy1[key] = copy2[key]
            }
        })

        return copy1
    },
    /**
     * Creates a deep copy of an object.
     *
     * **Note**: Recursive references are not supported.
     *
     *		var obj = {
     *			name: 'John',
     *			cars: {
     *				Mercedes: { color: 'blue' },
     *				Porsche: { color: 'red' }
     *			}
     *		};
     *		var clone = dataTools.clone( obj );
     *		clone.name = 'Paul';
     *		clone.cars.Porsche.color = 'silver';
     *
     *		alert( obj.name );					// 'John'
     *		alert( clone.name );				// 'Paul'
     *		alert( obj.cars.Porsche.color );	// 'red'
     *		alert( clone.cars.Porsche.color );	// 'silver'
     *
     * @param {Object} object The object to be cloned.
     * @returns {Object} The object clone.
     */
    clone: function (obj) {
        var clone

        // Array.
        if (obj && obj instanceof Array) {
            clone = []

            for (var i = 0; i < obj.length; i++) clone[i] = dataTools.clone(obj[i])

            return clone
        }

        // "Static" types.
        if (
            obj === null ||
            typeof obj !== 'object' ||
            obj instanceof String ||
            obj instanceof Number ||
            obj instanceof Boolean ||
            obj instanceof Date ||
            obj instanceof RegExp
        ) {
            return obj
        }

        // DOM objects and window.
        if (obj.nodeType || obj.window === obj) return obj

        // Objects.
        clone = new obj.constructor()

        for (var propertyName in obj) {
            var property = obj[propertyName]
            clone[propertyName] = dataTools.clone(property)
        }

        return clone
    },
    /**
     * Iterates over every element in the `array`.
     *
     * @param {Array} array An array to be iterated over.
     * @param {Function} fn The function called for every `array` element.
     * @param {Mixed} fn.value The currently iterated array value.
     * @param {Number} fn.index The index of the currently iterated value in an array.
     * @param {Array} fn.array The original array passed as an `array` variable.
     * @param {Mixed} [thisArg=undefined] The context object for `fn`.
     */
    forEach: function (array, fn, thisArg) {
        var len = array.length
        var i

        for (i = 0; i < len; i++) {
            fn.call(thisArg, array[i], i, array)
        }
    },
    /**
     * Returns the first element in the array for which the given callback `fn` returns `true`.
     *
     * ```js
     * var array = [ 1, 2, 3, 4 ];
     *
     * dataTools.find( array, function( item ) {
     *     return item > 2;
     * } ); // returns 3.
     * ```
     *
     * @param {Array} array An array to be iterated over.
     * @param {Function} fn A function called for every `array` element until it returns `true`.
     * @param {Mixed} fn.value The currently iterated array value.
     * @param {Number} fn.index The index of the currently iterated value in an array.
     * @param {Array} fn.array The original array passed as an `array` variable.
     * @param {Mixed} [thisArg=undefined] The context object for `fn`.
     * @returns {*} The first matched value or `undefined` otherwise.
     */
    find: function (array, fn, thisArg) {
        var length = array.length
        var i = 0

        while (i < length) {
            if (fn.call(thisArg, array[i], i, array)) {
                return array[i]
            }
            i++
        }

        return undefined
    },
    /**
     * Returns the index of an element in an array.
     *
     *		var letters = [ 'a', 'b', 0, 'c', false ];
     *		alert( dataTools.indexOf( letters, '0' ) );		// -1 because 0 !== '0'
     *		alert( dataTools.indexOf( letters, false ) );		// 4 because 0 !== false
     *
     * @param {Array} array The array to be searched.
     * @param {Object/Function} value The element to be found. This can be an
     * evaluation function which receives a single parameter call for
     * each entry in the array, returning `true` if the entry matches.
     * @returns {Number} The (zero-based) index of the first entry that matches
     * the entry, or `-1` if not found.
     */
    indexOf: function (array, value) {
        if (typeof value === 'function') {
            for (var i = 0, len = array.length; i < len; i++) {
                if (value(array[i])) return i
            }
        } else if (array.indexOf) return array.indexOf(value)
        else {
            for (i = 0, len = array.length; i < len; i++) {
                if (array[i] === value) return i
            }
        }
        return -1
    },
    /**
     * Applies a function to each element of an array and returns the array of results in the same order.
     * Note the order of the parameters.
     *
     * @param {Array} array An array of elements that `fn` is applied on.
     * @param {Function} fn A function with the signature `a -> b`.
     * @param {Mixed} [thisArg=undefined] The context object for `fn`.
     * @returns {Array} An array of mapped elements.
     */
    map: function (array, fn, thisArg) {
        var result = []
        for (var i = 0; i < array.length; i++) {
            result.push(fn.call(thisArg, array[i], i, array))
        }
        return result
    },
    /**
     * Returns a copy of `array` filtered using the `fn` function. Any elements that the `fn` will return `false` for
     * will get removed from the returned array.
     *
     *		var filtered = dataTools.filter( [ 0, 1, 2, 3 ], function( value ) {
     *			// Leave only values equal or greater than 2.
     *			return value >= 2;
     *		} );
     *		console.log( filtered );
     *		// Logs: [ 2, 3 ]
     *
     * @param {Array} array
     * @param {Function} fn A function that gets called with each `array` item. Any item that `fn`
     * returned a `false`-alike value for will be filtered out of the `array`.
     * @param {Mixed} fn.value The currently iterated array value.
     * @param {Number} fn.index The index of the currently iterated value in an array.
     * @param {Array} fn.array The original array passed as the `array` variable.
     * @param {Mixed} [thisArg=undefined] A context object for `fn`.
     * @returns {Array} The filtered array.
     */
    filter: function (array, fn, thisArg) {
        var ret = []

        dataTools.forEach(array, function (val, i) {
            if (fn.call(thisArg, val, i, array)) {
                ret.push(val)
            }
        })

        return ret
    },
    /**
     * Removes duplicates from the array.
     *
     * ```js
     * var array = dataTools.unique( [ 1, 1, 2, 3, 2 ] );
     * console.log( array );
     * // Logs: [ 1, 2, 3 ]
     * ```
     *
     * @param {Array} array Array from which duplicates should be removed.
     * @returns {Array} The copy of the input array without duplicates.
     */
    unique: function (array) {
        return dataTools.filter(array, function (item, index) {
            return index === dataTools.indexOf(array, item)
        })
    },
    createXMLHttpRequest: function () {
        var agent = navigator.userAgent.toLowerCase()
        var edge = agent.match(/edge[ \/](\d+.?\d*)/) // eslint-disable-line
        var trident = agent.indexOf('trident/') > -1
        var ie = !!(edge || trident)
        // In IE, using the native XMLHttpRequest for local files may throw
        // "Access is Denied" errors
        if (!ie || location.protocol !== 'file:') {
            try {
                return new XMLHttpRequest()
            } catch (e) {
                console.log(e)
            }
        }

        try {
            return new ActiveXObject('Msxml2.XMLHTTP') // eslint-disable-line
        } catch (e) {
            console.log(e)
        }
        try {
            return new ActiveXObject('Microsoft.XMLHTTP') // eslint-disable-line
        } catch (e) {
            console.log(e)
        }

        return null
    },
    checkStatus: function (xhr) {
        return (
            xhr.readyState === 4 &&
            ((xhr.status >= 200 && xhr.status < 300) ||
                xhr.status === 304 ||
                xhr.status === 0 ||
                xhr.status === 1223)
        )
    },
    getResponse: function (xhr, type) {
        if (!dataTools.checkStatus(xhr)) {
            return null
        }

        switch (type) {
            case 'text':
                return xhr.responseText
            case 'arraybuffer':
                return xhr.response
            default:
                return null
        }
    },
    load: function (url, callback, responseType) {
        var async = !!callback

        var xhr = dataTools.createXMLHttpRequest()

        if (!xhr) return null

        if (async && responseType !== 'text' && responseType !== 'xml') {
            xhr.responseType = responseType
        }

        xhr.open('GET', url, async)

        if (async) {
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    callback(dataTools.getResponse(xhr, responseType))
                    xhr = null
                }
            }
        }

        xhr.send(null)

        return async ? '' : dataTools.getResponse(xhr, responseType)
    },
}

const RTFTools = {
    /**
     * 从 RTF 数据中获取指定名称的所有分组
     * Get all groups from the RTF content with the given name.
     *
     * ```js
     * var rtfContent = '{\\rtf1\\some\\control\\words{\\group content}{\\group content}{\\whatever {\\subgroup content}}}',
     * 	groups = RTFTools.getGroups( rtfContent, '(group|whatever)' );
     *
     * console.log( groups );
     *
     * // Result of the console.log:
     * // [
     * // 	{"start":25,"end":41,"content":"{\\group content}"},
     * // 	{"start":41,"end":57,"content":"{\\group content}"},
     * // 	{"start":57,"end":88,"content":"{\\whatever {\\subgroup content}}"}
     * // ]
     * ```
     *
     * @param {String} rtfContent RTF 数据
     * @param {String} groupName 要获取的分组名, 可以是类似正则的字符串 '(group|whatever)' | Group name to find. It can be a regex-like string.
     * @returns {Array}
     */
    getGroups: function (rtfContent, groupName) {
        const groups = []
        let current
        let from = 0

        while (
            (current = RTFTools.getGroup(rtfContent, groupName, {
                start: from,
            }))
        ) {
            from = current.end

            groups.push(current)
        }

        return groups
    },
    /**
     * 从 RTF 数据中移除所有指定分组名的数据
     * Remove all groups from the RTF content with the given name.
     *
     * ```js
     * var rtfContent = '{\\rtf1\\some\\control\\words{\\group content}{\\group content}{\\whatever {\\subgroup content}}}',
     * 	rtfWithoutGroups = RTFTools.removeGroups( rtfContent, '(group|whatever)' );
     *
     * console.log( rtfWithoutGroups ); // {\rtf1\some\control\words}
     * ```
     *
     * @param {String} rtfContent RTF 数据
     * @param {String} groupName 要移除的分组名,可以是类似正则的字符串'(group|whatever)'| Group name to find. It can be a regex-like string.
     * @returns {String} RTF content without the removed groups.
     */
    removeGroups: function (rtfContent, groupName) {
        var current

        while ((current = RTFTools.getGroup(rtfContent, groupName))) {
            var beforeContent = rtfContent.substring(0, current.start)
            var afterContent = rtfContent.substring(current.end)

            rtfContent = beforeContent + afterContent
        }

        return rtfContent
    },
    /**
     * 从 RTF 数据中获取指定名称的分组
     * Get the group from the RTF content with the given name.
     *
     * Groups are recognized thanks to being in `{\<name>}` format.
     *
     * ```js
     * var rtfContent = '{\\rtf1\\some\\control\\words{\\group content1}{\\group content2}{\\whatever {\\subgroup content}}}',
     * 	firstGroup = RTFTools.getGroup( rtfContent, '(group|whatever)' ),
     * 	lastGroup = RTFTools.getGroup( rtfContent, '(group|whatever)', {
     * 		start: 50
     * 	} );
     *
     * console.log( firstGroup ); // {"start":25,"end":42,"content":"{\\group content1}"}
     * console.log( lastGroup ); // {"start":59,"end":90,"content":"{\\whatever {\\subgroup content}}"}
     * ```
     *
     * @param {String} content RTF 数据. RTF content.
     * @param {String} groupName 分组名. Group name to find. It can be a regex-like string.
     * @param {Object} options 可选项 Additional options.
     * @param {Number} options.start 从第几个字符串开始查找 String index on which the search should begin.
     * @returns {Object}
     */
    getGroup: function (content, groupName, options) {
        // This function is in fact a very primitive RTF parser.
        // It iterates over RTF content and search for the last } in the group
        // by keeping track of how many elements are open using a stack-like method.
        var open = 0
        // Despite the fact that we search for only one group,
        // the global modifier is used to be able to manipulate
        // the starting index of the search. Without g flag it's impossible.
        var startRegex = new RegExp('\\{\\\\' + groupName, 'g')
        var group
        var i
        var current

        options = dataTools.merge(
            {
                start: 0,
            },
            options || {}
        )

        startRegex.lastIndex = options.start
        group = startRegex.exec(content)

        if (!group) {
            return null
        }

        i = group.index
        current = content[i]

        do {
            // Every group start has format of {\. However there can be some whitespace after { and before /.
            // Additionally we need to filter also curly braces from the content – fortunately they are escaped.
            var isValidGroupStart =
                current === '{' &&
                RTFTools.getPreviousNonWhitespaceChar(content, i) !== '\\' &&
                RTFTools.getNextNonWhitespaceChar(content, i) === '\\'
            var isValidGroupEnd =
                current === '}' &&
                RTFTools.getPreviousNonWhitespaceChar(content, i) !== '\\' &&
                open > 0

            if (isValidGroupStart) {
                open++
            } else if (isValidGroupEnd) {
                open--
            }

            current = content[++i]
        } while (current && open > 0)

        return {
            start: group.index,
            end: i,
            content: content.substring(group.index, i),
        }
    },
    /**
     * 获取给定分组数据中的内容
     * Get group content.
     *
     * The content starts with the first character that is not a part of
     * control word or subgroup.
     *
     * ```js
     * var group = '{\\group{\\subgroup subgroupcontent} group content}',
     * 	groupContent = RTFTools.extractGroupContent( group );
     *
     * console.log( groupContent ); // "group content"
     * ```
     *
     * @param {String} group 分组的数据 Whole group string.
     * @returns {String} 分组的内容 Extracted group content.
     */
    extractGroupContent: function (group) {
        var groupName = RTFTools.getGroupName(group)
        var controlWordsRegex = /^\{(\\[\w-]+\s*)+/g
        // Sometimes content follows the last subgroup without any space.
        // We need to add it to correctly parse the whole thing.
        var subgroupWithousSpaceRegex = /\}([^{\s]+)/g

        group = group.replace(subgroupWithousSpaceRegex, '} $1')
        // And now remove all subgroups that are not the actual group.
        group = RTFTools.removeGroups(group, '(?!' + groupName + ')')
        // Remove all control words and trim the whitespace at the beginning
        // that could be introduced by preserving space after last subgroup.
        group = group.replace(controlWordsRegex, '').trim()

        // What's left is group content with } at the end.
        return group.replace(/}$/, '')
    },
    /**
     * 获取分组名
     * @param {String} group 分组数据
     * @returns 分组名称
     */
    getGroupName: function (group) {
        var groupNameRegex = /^\{\\(\w+)/
        var groupName = group.match(groupNameRegex)

        if (!groupName) {
            return null
        }

        return groupName[1]
    },
    /**
     * 查找指定方向的第一个不是空白字符的字符
     * @param {String} content 字符串数据
     * @param {Number} startIndex 开始查找的位置
     * @param {Number} direction 查找方向, 可能值为 1 向右, -1 向左
     * @returns {String}
     */
    getNonWhitespaceChar: function (content, startIndex, direction) {
        var index = startIndex + direction
        var current = content[index]
        var whiteSpaceRegex = /[\s]/

        while (current && whiteSpaceRegex.test(current)) {
            index = index + direction
            current = content[index]
        }

        return current
    },
    /**
     * 获取前面的第一个非空白字符
     * @param {String} content 需要查找的内容
     * @param {Number} index 开始的位置
     * @returns {String} 找到的第一个非空白字符
     */
    getPreviousNonWhitespaceChar: function (content, index) {
        return RTFTools.getNonWhitespaceChar(content, index, -1)
    },
    /**
     * 获取后面的第一个非空白字符
     * @param {String} content 需要查找的内容
     * @param {Number} index 开始的位置
     * @returns {String} 找到的第一个非空白字符
     */
    getNextNonWhitespaceChar: function (content, index) {
        return RTFTools.getNonWhitespaceChar(content, index, 1)
    },
}

const imageTools = {
    /**
     * 转换 16 进制数据为字节数据
     * Converts a hex string to an array containing 1 byte in each cell. Bytes are represented as Integer numbers.
     *
     * @param {String} hexString Contains an input string which represents bytes, e.g. `"08A11D8ADA2B"`.
     * @returns {Number[]} Bytes stored in a form of Integer numbers, e.g. `[ 8, 161, 29, 138, 218, 43 ]`.
     */
    convertHexStringToBytes: function (hexString) {
        var bytesArray = []
        var bytesArrayLength = hexString.length / 2
        var i

        for (i = 0; i < bytesArrayLength; i++) {
            bytesArray.push(parseInt(hexString.substr(i * 2, 2), 16))
        }
        return bytesArray
    },
    /**
     * 转换字节数据为 base64 格式数据
     * Converts a bytes array into a a Base64-encoded string.
     *
     * @param {Number[]} bytesArray An array that stores 1 byte in each cell as an Integer number.
     * @returns {String} Base64-encoded string that represents input bytes.
     */
    convertBytesToBase64: function (bytesArray) {
        // Bytes are `8bit` numbers, where base64 use `6bit` to store data. That's why we process 3 Bytes into 4 characters representing base64.
        //
        // Algorithm:
        // 1. Take `3 * 8bit`.
        // 2. If there is less than 3 bytes, fill empty bits with zeros.
        // 3. Transform `3 * 8bit` into `4 * 6bit` numbers.
        // 4. Translate those numbers to proper characters related to base64.
        // 5. If extra zero bytes were added fill them with `=` sign.
        //
        // Example:
        // 1. Bytes Array: [ 8, 161, 29, 138, 218, 43 ] -> binary: `0000 1000 1010 0001 0001 1101 1000 1010 1101 1010 0010 1011`.
        // 2. Binary: `0000 10|00 1010| 0001 00|01 1101| 1000 10|10 1101| 1010 00|10 1011` ← `|` (pipe) shows where base64 will cut bits during transformation.
        // 3. Now we have 6bit numbers (written in decimal values), which are translated to indexes in `base64characters` array.
        //    Decimal: `2 10 4 29 34 45 40 43` → base64: `CKEditor`.
        var base64characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
        var base64string = ''
        var bytesArrayLength = bytesArray.length
        var i

        for (i = 0; i < bytesArrayLength; i += 3) {
            var array3 = bytesArray.slice(i, i + 3)
            var array3length = array3.length
            var array4 = []
            var j

            if (array3length < 3) {
                for (j = array3length; j < 3; j++) {
                    array3[j] = 0
                }
            }

            // 0xFC -> 11111100 || 0x03 -> 00000011 || 0x0F -> 00001111 || 0xC0 -> 11000000 || 0x3F -> 00111111
            array4[0] = (array3[0] & 0xfc) >> 2
            array4[1] = ((array3[0] & 0x03) << 4) | (array3[1] >> 4)
            array4[2] = ((array3[1] & 0x0f) << 2) | ((array3[2] & 0xc0) >> 6)
            array4[3] = array3[2] & 0x3f

            for (j = 0; j < 4; j++) {
                // Example: if array3length == 1, then we need to add 2 equal signs at the end of base64.
                // array3[ 0 ] is used to calculate array4[ 0 ] and array4[ 1 ], so there will be regular values,
                // next two ones have to be replaced with `=`, because array3[ 1 ] and array3[ 2 ] wasn't present in the input string.
                if (j <= array3length) {
                    base64string += base64characters.charAt(array4[j])
                } else {
                    base64string += '='
                }
            }
        }
        return base64string
    },
    /**
     * 通过签名获取图片格式
     * @param {Array} bytesArray 字节数据
     * @returns {String} 图片格式
     */
    getImageTypeFromSignature: function (bytesArray) {
        var recognizableImageSignatures = [
            {
                signature: 'ffd8ff',
                type: 'image/jpeg',
            },

            {
                signature: '47494638',
                type: 'image/gif',
            },

            {
                signature: '89504e47',
                type: 'image/png',
            },
        ]
        var fileSignature = bytesArray.subarray(0, 4)
        var hexSignature = dataTools
            .map(fileSignature, function (signatureByte) {
                return signatureByte.toString(16)
            })
            .join('')
        var matchedType = dataTools.find(recognizableImageSignatures, function (test) {
            return hexSignature.indexOf(test.signature) === 0
        })

        if (!matchedType) {
            return null
        }

        return matchedType.type
    },
}

export default {
    ...dataTools,
    ...RTFTools,
    ...imageTools,
}

// 加密
// globalThis.crypto 此特性仅在一些支持的浏览器的安全上下文（HTTPS）中可用
const { subtle } = globalThis.crypto
const ec = new TextEncoder()
// const iv = ec.encode('nestAdmin')
// const iv = globalThis.crypto.getRandomValues(new Uint8Array(16))
const iv = Uint8Array.from([40, 157, 36, 126, 11, 144, 3, 41, 39, 8, 79, 210, 230, 222, 167, 91])
// console.log(Object.values(iv))
// const rawKey = Uint8Array.from('nestAdmin')
// const rawKey = globalThis.crypto.getRandomValues(new Uint8Array(256))
// const rawKey = await generateAesKey()
const rawKey = Uint8Array.from([
  194, 181, 53, 234, 250, 85, 168, 205, 114, 199, 141, 228, 115, 99, 93, 17, 234, 15, 185, 94, 247, 13, 104, 251, 146,
  183, 87, 41, 29, 153, 44, 32,
])

async function generateAesKey(mode = 'AES-GCM', length = 256) {
  let key = await subtle.generateKey({ name: mode, length }, true, ['encrypt', 'decrypt'])
  // 导出
  const exportedKeyBuffer = await subtle.exportKey('raw', key)
  return new Uint8Array(exportedKeyBuffer)
}

async function importKey(rawKey, mode = 'AES-GCM') {
  return await subtle.importKey('raw', rawKey, mode, true, ['encrypt', 'decrypt'])
}

//加密
export async function encrypt(str, mode = 'AES-GCM') {
  // 解密时也需要使用 iv
  let res = await subtle.encrypt({ name: mode, iv: iv }, await importKey(rawKey), ec.encode(str))
  // return globalThis.btoa(new TextDecoder().decode(new Uint8Array(res).buffer))
  return globalThis.btoa(String.fromCharCode.apply(null, new Uint8Array(res)))
}

//解密
export async function decrypt(str, mode = 'AES-GCM') {
  let res = await subtle.decrypt({ name: mode, iv: iv }, await importKey(rawKey), str2ab(globalThis.atob(str)))
  return String.fromCharCode.apply(null, new Uint8Array(res))
  // return new TextDecoder().decode(res)
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

// base64加密
export function encryptB64(str) {
  return window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode('0x' + p1)
    }),
  )
}

// base64解密
export function decryptB64(str) {
  const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  function utf8_decode(utftext) {
    var string = ''
    var i = 0
    var c = 0
    var c1 = 0
    var c2 = 0
    while (i < utftext.length) {
      c = utftext.charCodeAt(i)
      if (c < 128) {
        string += String.fromCharCode(c)
        i++
      } else if (c > 191 && c < 224) {
        c1 = utftext.charCodeAt(i + 1)
        string += String.fromCharCode(((c & 31) << 6) | (c1 & 63))
        i += 2
      } else {
        c1 = utftext.charCodeAt(i + 1)
        c2 = utftext.charCodeAt(i + 2)
        string += String.fromCharCode(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63))
        i += 3
      }
    }
    return string
  }
  function decode(input) {
    var output = ''
    var chr1, chr2, chr3
    var enc1, enc2, enc3, enc4
    var i = 0
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '')
    while (i < input.length) {
      enc1 = keyStr.indexOf(input.charAt(i++))
      enc2 = keyStr.indexOf(input.charAt(i++))
      enc3 = keyStr.indexOf(input.charAt(i++))
      enc4 = keyStr.indexOf(input.charAt(i++))
      chr1 = (enc1 << 2) | (enc2 >> 4)
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
      chr3 = ((enc3 & 3) << 6) | enc4
      output = output + String.fromCharCode(chr1)
      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2)
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3)
      }
    }
    output = utf8_decode(output)
    return output
  }
  return decode(str)
}

/**
 * 递归解密对象数据
 * @param {*} data
 * @param {*} decryptFun
 * @returns
 */
export function decryptObj(data, decryptFun) {
  let res = {}
  Object.keys(data).forEach((key) => {
    const value = data[key]
    if (typeof value === 'string') {
      res[key] = decryptFun(value)
    } else if (Object.prototype.toString.apply(value) === '[object Object]') {
      res[key] = decryptObj(value, decryptFun)
    }
  })
  return res
}
// console.log(await encrypt('123456'))

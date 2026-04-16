// @ts-nocheck
const serve = '/ai/chat'
export const { getOne, del, save } = $sdk.baseApi(serve)

const { get, post, put, del: dele } = $sdk.request

export const getSessionList = (data) => {
  data.isSession = 1
  return get(`${serve}/list`, data)
}

/**
 * 发送消息
 * @param {*} data
 * {
    "msg": {
        "content": "string", // 内容
        "role": "string" // 角色
    },
    "sessionId": "string" // 会话ID
}
 * @returns
 */
export function send(data, callback) {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', window.sysConfig.BASE_API + serve + '/send')

  xhr.withCredentials = true
  xhr.setRequestHeader('Content-type', 'application/json')
  xhr.setRequestHeader('Accept', 'text/event-stream')

  xhr.onreadystatechange = () => {
    if (!xhr.responseText) return
    console.log(xhr.responseText)
    // console.log('readyState', xhr.readyState)
    // if (xhr.readyState === XMLHttpRequest.LOADING) {

    // } else
    if (xhr.readyState === XMLHttpRequest.DONE || xhr.readyState === XMLHttpRequest.LOADING) {
      console.log('status', xhr.status, xhr.readyState)
      if (xhr.status !== 200) {
        callback?.({ code: xhr.status, data: null, msg: `服务端 ${xhr.status} 错误` })
      } else if (xhr.responseText.includes('\n')) {
        // 处理 Event Stream数据
        const events = xhr.responseText.split('\n\n').filter((e) => !!e)
        // console.log(events)

        const list = events.map((eventData) => {
          const lines = eventData.split('\n')
          const event = {}
          lines.forEach((line) => {
            if (line.startsWith('data: {')) {
              event.data = JSON.parse(line.slice(line.indexOf('{')))
            } else {
              const [key, value] = line.split(':')
              event[key] = value
            }
          })
          return event
        })

        console.log(list)
        if (xhr.readyState === XMLHttpRequest.DONE && list?.length == 1) {
          callback?.({ data: list, msg: list?.[0]?.data || '无有效回复，请检查接口是否欠费或超额等问题' })
        } else {
          callback?.({ code: 200, data: list })
        }
      } else {
        try {
          let resData = JSON.parse(xhr.responseText || '{}')
          resData.code != 200 && callback?.(resData)
        } catch (error) {
          throw error
        }
      }
    }
  }

  xhr.send(JSON.stringify(data))

  // var source = new EventSource(window.sysConfig.BASE_API + serve + '/send', {
  //   headers: { Authorization: window.sysConfig.headers.Authorization },
  // })
  // source.onmessage = function (mes) {
  //   console.log(mes)
  //   // mes.on('message', (message) => {
  //   //   res.write(message.data)
  //   //   console.log(message)
  //   //   let data = JSON.parse(message.data)
  //   //   if (data.Choices?.[0]?.FinishReason === 'stop') {
  //   //     res.end()
  //   //   }
  //   // })
  // }
  // return post(serve + '/send/msg', data, { headers: { Accept: 'text/event-stream' } })
}

/**
 * 会话详情 （会话中消息列表）
 */
export function getList(params) {
  return get(serve + '/list', params).then((res) => {
    res.data = res.data?.reduce((arr, element) => {
      return arr.concat([
        { ...element, text: element.question, role: 'user' },
        { ...element, text: element.answer },
      ])
    }, [])
    return res
  })
}

/**
 * 收藏会话中某条消息
 * @param {*} data
{
  "id": "string",
  "status": 0  // 收藏状态 0-未收藏 1-已收藏
}
 * @returns
 */
export function collect(data) {
  return post(serve + '/collect', data)
}

/**
 * 收藏列表
 * {
 * pageNum,pageSize
 * keywords
 * sessionId
 * }
 */
export function getCollectList(data) {
  return post(serve + '/list', {
    msg: {
      content: data.keywords,
      // role: 'string',
    },
    content: data.keywords,
    ...data,
  }).then((res) => {
    let arr = []
    res?.rows?.forEach((element) => {
      arr.push(...element.contentList)
    })
    arr?.forEach((element) => {
      element.text = element.content
    })
    res.rows = arr
    return res
  })
}

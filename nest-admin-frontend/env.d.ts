/// <reference types="vite/client" />

// 声明全局 $sdk 变量
declare const $sdk: any

export interface pageQuery {
	pageNum?: number
	pageSize?: number
	[key: string]: any
}

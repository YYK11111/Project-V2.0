export async function confirmRepublishIfNeeded(options: {
  articleId?: string | null
  entityLabel: string
}) {
  if (!options.articleId) return
  await $sdk.confirm(`重新沉淀将基于当前${options.entityLabel}内容再次生成知识，是否继续？`)
}

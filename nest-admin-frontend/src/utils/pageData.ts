export function normalizePageData(res: any) {
  const page = res?.data?.data || res?.data || {}
  const list = Array.isArray(page) ? page : page.list || page.rows || page.data || []
  const total = Number((Array.isArray(page) ? res?.total : page.total) || res?.total || 0)
  return {
    ...res,
    list,
    data: list,
    rows: list,
    total,
  }
}

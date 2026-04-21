export interface TocItem {
  id: string
  text: string
  level: number
}

function getUniqueHeadingId(usedIds: Set<string>, generatedIndex: number): { id: string; nextIndex: number } {
  let nextIndex = generatedIndex
  let candidate = ''

  do {
    nextIndex += 1
    candidate = `heading-${nextIndex}`
  } while (usedIds.has(candidate))

  return {
    id: candidate,
    nextIndex,
  }
}

export function extractTocItems(container: HTMLElement): TocItem[] {
  const headings = Array.from(container.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
  const usedIds = new Set<string>()
  const duplicateIds = new Set<string>()

  Array.from(container.querySelectorAll<HTMLElement>('[id]')).forEach((element) => {
    const id = element.id.trim()
    if (!id) return
    if (usedIds.has(id)) {
      duplicateIds.add(id)
      return
    }
    usedIds.add(id)
  })
  let generatedIndex = 0

  return headings.reduce<TocItem[]>((items, heading) => {
    const text = (heading.textContent || '').trim()
    if (!text) return items

    const currentId = heading.id.trim()

    if (!currentId) {
      const uniqueHeading = getUniqueHeadingId(usedIds, generatedIndex)
      generatedIndex = uniqueHeading.nextIndex
      heading.id = uniqueHeading.id
      usedIds.add(uniqueHeading.id)
    } else if (duplicateIds.has(currentId)) {
      duplicateIds.delete(currentId)
    } else if (items.some((item) => item.id === currentId)) {
      const uniqueHeading = getUniqueHeadingId(usedIds, generatedIndex)
      generatedIndex = uniqueHeading.nextIndex
      heading.id = uniqueHeading.id
      usedIds.add(uniqueHeading.id)
    }

    items.push({
      id: heading.id,
      text,
      level: Number(heading.tagName.slice(1)),
    })

    return items
  }, [])
}

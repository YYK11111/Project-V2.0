const defaultLocaleStore = Object.freeze({
  zh: {
    editor: {
      placeholder: '请输入内容',
    },
  },
  en: {
    editor: {
      placeholder: 'Please enter content',
    },
  },
})

function cloneLocaleStore() {
  return JSON.parse(JSON.stringify(defaultLocaleStore))
}

export function addLocale(localeStore, lng, resources) {
  localeStore[lng] = resources
  return localeStore[lng]
}

export function getLocale(localeStore, lng) {
  return localeStore[lng]
}

export function resolveLocaleText(localeStore, locale, key) {
  const keys = key.split('.')
  let value = localeStore[locale] || localeStore.zh

  for (const currentKey of keys) {
    value = value?.[currentKey]
  }

  return typeof value === 'string' ? value : keys.at(-1) ?? key
}

export function createLocales(initialLocale = 'zh') {
  let currentLocale = initialLocale
  const localeStore = cloneLocaleStore()

  return {
    addResourceBundle(lng, _ns, resources) {
      addLocale(localeStore, lng, resources)
    },
    changeLanguage(lng) {
      currentLocale = lng
    },
    getResourceBundle(lng) {
      return getLocale(localeStore, lng)
    },
    t(key) {
      return resolveLocaleText(localeStore, currentLocale, key)
    },
    exists(key) {
      return resolveLocaleText(localeStore, currentLocale, key) !== (key.split('.').at(-1) ?? key)
    },
  }
}

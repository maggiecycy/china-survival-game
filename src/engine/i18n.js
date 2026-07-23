/**
 * Engine: i18n helpers（纯函数，不依赖 Vue）
 */

export function t(bilingualObj, language) {
  if (!bilingualObj) return ''
  return bilingualObj[language] ?? bilingualObj.cn ?? bilingualObj.en ?? ''
}

export function pickLang(cn, en, language) {
  return language === 'en' ? en : cn
}

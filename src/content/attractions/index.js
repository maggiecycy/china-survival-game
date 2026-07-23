import beijing from './beijing.json'
import shanghai from './shanghai.json'
import chengdu from './chengdu.json'
import xian from './xian.json'
import shenzhen from './shenzhen.json'
import hangzhou from './hangzhou.json'
import hongkong from './hongkong.json'

/** 其餘城市用通用模板生成（見 getAttractionsOrFallback） */
export const attractionsByCity = {
  beijing,
  shanghai,
  chengdu,
  xian,
  shenzhen,
  hangzhou,
  hongkong,
}

export default attractionsByCity

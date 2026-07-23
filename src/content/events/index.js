import transit_first_departure from './transit_first_departure.json'
import lodging_resolve from './lodging_resolve.json'

import beijing_forbidden_city from './beijing_forbidden_city.json'
import beijing_great_wall from './beijing_great_wall.json'
import beijing_hutong from './beijing_hutong.json'
import beijing_temple_heaven from './beijing_temple_heaven.json'
import beijing_roast_duck from './beijing_roast_duck.json'

import shanghai_miniprogram from './shanghai_miniprogram.json'
import shanghai_bund from './shanghai_bund.json'
import shanghai_disney from './shanghai_disney.json'
import shanghai_wukang from './shanghai_wukang.json'

import chengdu_hotpot from './chengdu_hotpot.json'
import chengdu_pandas from './chengdu_pandas.json'
import chengdu_jinli from './chengdu_jinli.json'

import xian_terracotta from './xian_terracotta.json'
import xian_muslim_quarter from './xian_muslim_quarter.json'
import xian_city_wall from './xian_city_wall.json'

import shenzhen_face_gate from './shenzhen_face_gate.json'
import shenzhen_tech_mall from './shenzhen_tech_mall.json'
import shenzhen_bay from './shenzhen_bay.json'

import hangzhou_fish from './hangzhou_fish.json'
import hangzhou_west_lake from './hangzhou_west_lake.json'
import hangzhou_longjing from './hangzhou_longjing.json'

import hongkong_dual_currency from './hongkong_dual_currency.json'
import hongkong_exit from './hongkong_exit.json'

/** 舊城市整圖保留作 fallback；景點優先用下方獨立 graph */
import shanghai from './shanghai.json'
import shenzhen from './shenzhen.json'
import hangzhou from './hangzhou.json'
import hongkong from './hongkong.json'
import beijing from './beijing.json'
import chengdu from './chengdu.json'
import chongqing from './chongqing.json'
import xian from './xian.json'
import zhangjiajie from './zhangjiajie.json'
import guilin from './guilin.json'
import tibet from './tibet.json'
import xinjiang from './xinjiang.json'
import nanjing from './nanjing.json'
import hainan from './hainan.json'

export const eventGraphs = {
  transit_first_departure,
  lodging_resolve,

  beijing_forbidden_city,
  beijing_great_wall,
  beijing_hutong,
  beijing_temple_heaven,
  beijing_roast_duck,

  shanghai_miniprogram,
  shanghai_bund,
  shanghai_disney,
  shanghai_wukang,

  chengdu_hotpot,
  chengdu_pandas,
  chengdu_jinli,

  xian_terracotta,
  xian_muslim_quarter,
  xian_city_wall,

  shenzhen_face_gate,
  shenzhen_tech_mall,
  shenzhen_bay,

  hangzhou_fish,
  hangzhou_west_lake,
  hangzhou_longjing,

  hongkong_dual_currency,
  hongkong_exit,

  // legacy city hubs（無 attractions 配置的城市仍可用）
  shanghai,
  shenzhen,
  hangzhou,
  hongkong,
  beijing,
  chengdu,
  chongqing,
  xian,
  zhangjiajie,
  guilin,
  tibet,
  xinjiang,
  nanjing,
  hainan,
}

export default eventGraphs

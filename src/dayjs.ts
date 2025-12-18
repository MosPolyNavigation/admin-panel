import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import isoWeek from 'dayjs/plugin/isoWeek'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

// Настройка плагинов
dayjs.extend(weekOfYear)
dayjs.extend(quarterOfYear)
dayjs.extend(isoWeek)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)

// Установка русской локали
dayjs.locale('ru')

export default dayjs

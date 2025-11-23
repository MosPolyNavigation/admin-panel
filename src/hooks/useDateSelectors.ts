import { useState } from 'react'
import { type DateInterval, DateIntervalType } from '../components/defs.ts'
import { useFirstDay } from './useFirstDay'
import dayjs from '../dayjs.ts'

import { configDsFirstDay } from '../components/config.ts'

export const useDateSelectors = () => {
  const { data: firstDay } = useFirstDay()
  const [dateInterval, setDateInterval] = useState<DateInterval>({
    type: DateIntervalType.Month,
    startDate: firstDay?.format('YYYY-MM-DD') ?? configDsFirstDay.format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    isSetted: false,
  })

  return { dateInterval, setDateInterval }
}

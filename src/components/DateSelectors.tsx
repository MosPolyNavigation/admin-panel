import {tc} from './theme.ts'
import {useFirstDay} from '../hooks/useFirstDay.ts'
import dayjs from '../dayjs.ts'
import {configDsFirstDay, configDsToday} from './config.ts'
import {Box, Button, Sheet} from '@mui/joy'
import type {SxProps} from '@mui/joy/styles/types'
import {useCallback, useEffect, useRef, useState} from 'react'
// @ts-expect-error нет типа в библиотеке, летим вслепую
import opacity from 'react-element-popper/animations/opacity'
// @ts-expect-error нет типа в библиотеке, летим вслепую
import transition from 'react-element-popper/animations/transition'
import DatePicker, {DateObject} from 'react-multi-date-picker'
import {
    type DateInterval,
    DateIntervalType,
    datePickerRangeStylesLocal,
    months,
    weekDays,
} from './defs.ts'
import {CalendarDaysIcon, XIcon} from 'lucide-react'

interface DateSelectorProps {
    dateInterval: DateInterval
    onDateIntervalChange: (interval: DateInterval) => void
    omit?: DateIntervalType[]
    /** Тип диапазона по умолчанию , должен совпадать с типом диапазона в useDateSelectors (или не быть, по умолчанию AllTime)*/
    defaultDateInterval?: DateIntervalType
    maxSelectedDays?: number
}

const today = configDsToday

const todayValue = `${DateIntervalType.Today}_${today.format('YYYY-MM-DD')}_${today.format('YYYY-MM-DD')}`
const yesterdayValue = `${DateIntervalType.Yesterday}_${today.subtract(1, 'day').format('YYYY-MM-DD')}_${today.subtract(1, 'day').format('YYYY-MM-DD')}`

/** Компонент для выбора диапазона дат. Возможные варианты: сегодня, вчера, неделя с выбором, месяц с выбором, квартал с выбором, год с выбором, и за всё время (от первого до сегодняшнего дня) */
const DateSelectors = ({
                           dateInterval,
                           onDateIntervalChange,
                           omit = [],
                           defaultDateInterval = DateIntervalType.AllTime,
                           maxSelectedDays,
                       }: DateSelectorProps) => {
    const {data: firstDayFromServer} = useFirstDay()
    // const firstDay = dayjs('2025-01-01')
    const firstDay = firstDayFromServer ?? configDsFirstDay

    const [calendarOpen, setCalendarOpen] = useState(false)
    const [calendarValue, setCalendarValue] = useState<DateObject[]>([])
    const menuRef = useRef<HTMLDivElement>(null)

    const handleSelectChange = useCallback(
        (value: string) => {
            if (!value) return
            const type = value.split('_')[0] as DateIntervalType
            onDateIntervalChange({
                type,
                startDate: value.split('_')[1],
                endDate: value.split('_')[2],
                isSetted: true,
            })
        },
        [onDateIntervalChange],
    )

    // Универсальная функция для создания периода (неделя/месяц)
    const createPeriodRange = useCallback(
        (days: number, type: DateIntervalType) => {
            const periodEnd = today
            const periodStart = today.subtract(days - 1, 'day')
            const actualStart = periodStart.isBefore(firstDay) ? firstDay : periodStart

            return `${type}_${actualStart.format('YYYY-MM-DD')}_${periodEnd.format('YYYY-MM-DD')}`
        },
        [firstDay],
    )

    // Обработка выбора дат в календаре
    const handleCalendarChange = useCallback(
        (dates: DateObject[]) => {
            if (dates.length === 2) {
                const startDate = dates[0].format('YYYY-MM-DD')
                const endDate = dates[1].format('YYYY-MM-DD')

                if (maxSelectedDays) {
                    const daysDiff = Math.abs(dayjs(endDate).diff(dayjs(startDate), 'day')) + 1
                    if (daysDiff > maxSelectedDays) {
                        window.alert(`Вы можете выбрать не более ${maxSelectedDays} дней`)
                        return
                    }
                }

                onDateIntervalChange({
                    type: DateIntervalType.Custom,
                    startDate,
                    endDate,
                    isSetted: true,
                })

                setCalendarOpen(false)
            }
        },
        [onDateIntervalChange, maxSelectedDays],
    )

    // Обработчик клика вне меню
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setCalendarOpen(false)
            }
        }

        if (calendarOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [calendarOpen])

    // Форматирование отображаемого диапазона
    const formatDateRange = useCallback((startDate: string, endDate: string) => {
        const start = dayjs(startDate)
        const end = dayjs(endDate)

        if (start.year() === end.year()) {
            if (start.month() === end.month()) {
                return `${start.format('DD')} - ${end.format('DD MMMM YYYY')}`
            } else {
                return `${start.format('DD MMMM')} - ${end.format('DD MMMM YYYY')}`
            }
        } else {
            return `${start.format('DD MMMM YYYY')} - ${end.format('DD MMMM YYYY')}`
        }
    }, [])

    // Синхронизация календаря с текущим DateInterval
    useEffect(() => {
        if (dateInterval.type === DateIntervalType.Custom) {
            const startDate = new DateObject(dateInterval.startDate)
            const endDate = new DateObject(dateInterval.endDate)
            setCalendarValue([startDate, endDate])
        } else {
            setCalendarValue([])
        }
    }, [dateInterval])

    // Устанавливаем значение по умолчанию если оно задано и не было установлено
    const isSetted = useRef(false)
    useEffect(() => {
        if (!omit.includes(defaultDateInterval) && !isSetted.current) {
            if ([DateIntervalType.Today, DateIntervalType.Yesterday].includes(defaultDateInterval as any)) {
                handleSelectChange(
                    defaultDateInterval === DateIntervalType.Today ? todayValue : yesterdayValue,
                )
                isSetted.current = true
                return
            } else if (defaultDateInterval === DateIntervalType.Week) {
                handleSelectChange(createPeriodRange(7, DateIntervalType.Week))
                isSetted.current = true
                return
            } else if (defaultDateInterval === DateIntervalType.Month) {
                handleSelectChange(createPeriodRange(30, DateIntervalType.Month))
                isSetted.current = true
                return
            } else if (defaultDateInterval === DateIntervalType.AllTime && !!firstDayFromServer) {
                handleSelectChange(
                    `${DateIntervalType.AllTime}_${firstDay.format('YYYY-MM-DD')}_${today.format('YYYY-MM-DD')}`,
                )
                isSetted.current = true
                return
            }
        } else {
            isSetted.current = true
        }
    }, [
        defaultDateInterval,
        omit,
        handleSelectChange,
        firstDay,
        firstDayFromServer,
        createPeriodRange,
    ])

    const getStyle = (
        type: DateIntervalType,
        sx?: SxProps,
    ): { variant: 'soft' | 'plain'; color: 'primary' | 'neutral'; sx: SxProps } => {
        const selected = type === dateInterval.type

        return {
            variant: 'plain',
            color: selected ? 'primary' : 'neutral',
            sx: {
                fontWeight: 400,
                backgroundColor: selected ? tc.primary[100] : tc.common.white,
                border: selected ? `1px solid ${tc.primary[400]}` : undefined,
                m: selected ? '-1px' : 0,
                zIndex: selected ? 1 : 0,
                color: selected ? tc.primary[800] : tc.neutral[800],
                ...sx,
            },
        }
    }

    return (
        <Sheet
            variant='outlined'
            sx={{
                borderRadius: 'md',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                position: 'relative',
            }}
        >
            {!omit.includes(DateIntervalType.Today) && (
                <Button
                    onClick={() => handleSelectChange(todayValue)}
                    {...getStyle(DateIntervalType.Today)}
                >
                    Сегодня
                </Button>
            )}

            {!omit.includes(DateIntervalType.Yesterday) && (
                <Button
                    {...getStyle(DateIntervalType.Yesterday)}
                    onClick={() => handleSelectChange(yesterdayValue)}
                >
                    Вчера
                </Button>
            )}

            {!omit.includes(DateIntervalType.Week) && (
                <Button
                    {...getStyle(DateIntervalType.Week)}
                    onClick={() => handleSelectChange(createPeriodRange(7, DateIntervalType.Week))}
                >
                    Неделя
                </Button>
            )}

            {!omit.includes(DateIntervalType.Month) && (
                <Button
                    {...getStyle(DateIntervalType.Month)}
                    onClick={() => handleSelectChange(createPeriodRange(30, DateIntervalType.Month))}
                >
                    Месяц
                </Button>
            )}

            {!omit.includes(DateIntervalType.AllTime) && (
                <Button
                    {...getStyle(DateIntervalType.AllTime)}
                    onClick={() =>
                        handleSelectChange(
                            `${DateIntervalType.AllTime}_${firstDay.format('YYYY-MM-DD')}_${today.format('YYYY-MM-DD')}`,
                        )
                    }
                    endDecorator={dateInterval.type !== DateIntervalType.AllTime && <XIcon/>}
                >
                    Всё время
                </Button>
            )}

            {/* Кнопка календаря */}

            <Box sx={{...datePickerRangeStylesLocal}}>
                <DatePicker
                    value={calendarValue}
                    onChange={handleCalendarChange}
                    range
                    rangeHover
                    minDate={firstDay.toDate()}
                    maxDate={today.add(0, 'day').endOf('day').toDate()}
                    format='DD/MM/YYYY'
                    style={{
                        width: '300px',
                    }}
                    showOtherDays
                    months={months}
                    weekDays={weekDays}
                    weekStartDayIndex={1}
                    animations={[
                        opacity({
                            transition: 'all 150ms ease',
                        }),
                        transition({
                            from: 20,
                            transition: 'all 150ms ease',
                        }),
                    ]}
                    render={(_, openCalendar) => {
                        return (
                            <Button {...getStyle(DateIntervalType.Custom, {gap: 1})} onClick={openCalendar}>
                                {
                                    // dateInterval.type === DateIntervalType.Custom &&
                                    formatDateRange(dateInterval.startDate, dateInterval.endDate)
                                }
                                <CalendarDaysIcon/>
                            </Button>
                        )
                    }}
                />
            </Box>
        </Sheet>
    )
}

export default DateSelectors

import { type SxProps } from "@mui/joy/styles/types";



export const DateIntervalType = {
  Today: 'Today',
  Yesterday: 'Yesterday',
  Week: 'Week',
  Month: 'Month',
  Quarter: 'Quarter',
  Year: 'Year',
  AllTime: 'AllTime',
  Custom: 'Custom',
} as const; 
export type DateIntervalType = typeof DateIntervalType[keyof typeof DateIntervalType];


export const months = [
  ['Январь', 'Янв'],
  ['Февраль', 'Фев'],
  ['Март', 'Мар'],
  ['Апрель', 'Апр'],
  ['Май', 'Мая'],
  ['Июнь', 'Июня'],
  ['Июль', 'Июля'],
  ['Август', 'Авг'],
  ['Сентябрь', 'Сен'],
  ['Октябрь', 'Окт'],
  ['Ноябрь', 'Ноя'],
  ['Декабрь', 'Дек'],
]

export const weekDays = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']

export type DateInterval = {
  /** Тип диапазона */
  type: DateIntervalType; 
  /** Начальная дата */
  startDate: string;
  /** Конечная дата */
  endDate: string;
  /** Флаг, что значение установлено */
  isSetted?: boolean;
};


export const datePickerRangeStylesLocal: SxProps = (theme) => ({
  '*': {
    fontFamily: theme.vars.fontFamily.body,
  },
  '.rmdp-day': {
    color: theme.vars.palette.text.primary,
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },
  '.rmdp-today span': {
    color: theme.vars.palette.text.primary,
    backgroundColor: 'transparent',
  },
  '.rmdp-range': {
    backgroundColor: theme.vars.palette.primary[300],
    color: theme.vars.palette.primary[50],
    boxShadow: 'none',
  },
  '.rmdp-range-hover': {
    backgroundColor: theme.vars.palette.primary[100],
    boxShadow: 'none',
  },
  '.start, .end': {
    backgroundColor: theme.vars.palette.primary[400],
    fontWeight: 500,
    color: theme.vars.palette.common.white,
    '& span': {
      backgroundColor: theme.vars.palette.primary[300],
    },
  },
  '.rmdp-today': {
    fontWeight: 500,
    backgroundColor: theme.vars.palette.primary[600],
    '& span': {
      backgroundColor: theme.vars.palette.primary[300],
      color: theme.vars.palette.common.white,
    },
    '&:not(.rmdp-range)': {
      borderRadius: '50%',
      '& span': {
        backgroundColor: theme.vars.palette.primary[50],
        color: theme.vars.palette.primary[800],
      },
    },
  },
  '.rmdp-disabled span': {
    color: theme.vars.palette.text.secondary,
    opacity: 0.5,
  },
  '.rmdp-deactive span': {
    color: theme.vars.palette.text.secondary,
  },
});
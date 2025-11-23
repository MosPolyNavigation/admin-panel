// src/components/config.ts
import dayjs from '../dayjs';

export const configDsFirstDay = dayjs().subtract(1, 'year'); // Год назад
export const configDsToday = dayjs(); // Текущая дата
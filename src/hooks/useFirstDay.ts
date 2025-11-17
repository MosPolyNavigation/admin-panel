import dayjs from '../dayjs';

// возвращает первую доступную дату
export const useFirstDay = () => {
  // Возвращаем дату год назад как первую доступную дату
  const data = dayjs().subtract(1, 'year');
  
  return { 
    data, 
    loading: false, 
    error: null 
  };
};
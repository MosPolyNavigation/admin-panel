export function openSidebar() {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.setProperty('--SideNavigation-slideIn', '1');
  }
}

export function closeSidebar() {
  if (typeof window !== 'undefined') {
    document.documentElement.style.removeProperty('--SideNavigation-slideIn');
    document.body.style.removeProperty('overflow');
  }
}

export function toggleSidebar() {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const slideIn = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--SideNavigation-slideIn');
    if (slideIn) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }
}

export function translateProblemId(problemId: string): string {
  const translations: Record<string, string> = {
    other: 'Другое',
    plan: 'Неточность на плане',
    work: 'Работа приложения',
    way: 'Неправильный маршрут',
  };

  return translations[problemId] || problemId;
}

export function buildFilterParts(filters: Record<string, unknown>): string[] {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'number' && !Number.isNaN(value)) {
      parts.push(`${key}: {eq: ${value}}`);
    } else if (typeof value === 'string' && value.trim() !== '') {
      // Экранируем строку для GraphQL
      parts.push(`${key}: {startsWith: ${JSON.stringify(value.trim())}}`);
    } else if (typeof value === 'boolean') {
      parts.push(`${key}: {eq: ${value}}`);
    }
  }

  return parts;
}

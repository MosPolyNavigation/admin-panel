import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Breadcrumbs, Link, Typography } from '@mui/joy';
import { HomeRounded, ChevronRightRounded } from '@mui/icons-material';
import { BASE_PATH } from '../config.ts';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Логические пути БЕЗ BASE_PATH
const PATH_LABELS: Record<string, string> = {
  '/': 'Главная',
  '/users': 'Пользователи',
  '/users/:id': 'Профиль пользователя',
  '/profile': 'Мой профиль',
  '/dashboards': 'Дашборды',
  '/reviews': 'Отзывы',
  '/reviews/:id': 'Просмотр отзыва',
  '/roles': 'Роли',
  '/roles/:id': 'Редактирование роли',
  '/bans': 'Забаненные пользователи',
  '/bans/:id': 'Информация о бане',
  '/navigation': 'Навигация',
  '/navigation/locations': 'Локации',
  '/navigation/campuses': 'Корпуса',
  '/navigation/plans': 'Планы',
  '/navigation/auditories': 'Аудитории',
};

function matchRoute(path: string, pattern: string): boolean {
  const regexPattern = pattern.replace(/:[a-zA-Z0-9_]+/g, '[^/]+').replace(/\//g, '\\/');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

function AutoBreadcrumbs() {
  const navigate = useNavigate();

  const { breadcrumbs, lastLabel } = useMemo(() => {
    const fullPath = window.location.pathname;

    const basePath = BASE_PATH.endsWith('/') ? BASE_PATH.slice(0, -1) : BASE_PATH; // → "/admin"

    let logicalPath = '/';

    if (fullPath.startsWith(basePath + '/') || fullPath === basePath) {
      logicalPath = fullPath.slice(basePath.length) || '/';
    }

    if (!logicalPath.startsWith('/')) {
      logicalPath = '/' + logicalPath;
    }

    const pathSnippets = logicalPath.split('/').filter(Boolean); // ['users', '123']
    const breadcrumbsArray: BreadcrumbItem[] = [{ label: 'Главная', href: '/' }];

    let currentPath = '';

    for (let i = 0; i < pathSnippets.length; i++) {
      const snippet = pathSnippets[i];
      currentPath += `/${snippet}`;

      if (PATH_LABELS[currentPath]) {
        breadcrumbsArray.push({
          label: PATH_LABELS[currentPath],
          href: currentPath,
        });
      } else {
        const matchedPattern = Object.keys(PATH_LABELS).find((pattern) =>
          matchRoute(currentPath, pattern)
        );

        if (matchedPattern) {
          breadcrumbsArray.push({
            label: PATH_LABELS[matchedPattern],
            href: currentPath,
          });
        } else {
          breadcrumbsArray.push({
            label: decodeURIComponent(snippet),
            href: currentPath,
          });
        }
      }
    }

    const lastBreadcrumb = breadcrumbsArray.pop();
    const lastLabel = lastBreadcrumb?.label || '';

    return { breadcrumbs: breadcrumbsArray, lastLabel };
  }, []);

  const handleClick = (href: string) => {
    navigate(href);
  };

  return (
    <Breadcrumbs
      size="sm"
      aria-label="breadcrumbs"
      separator={<ChevronRightRounded />}
      sx={{ pl: 0 }}
    >
      {breadcrumbs.map((crumb, index) => (
        <Link
          key={crumb.href}
          underline="hover"
          color="neutral"
          onClick={() => handleClick(crumb.href!)}
          sx={{ fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
        >
          {index === 0 ? <HomeRounded /> : crumb.label}
        </Link>
      ))}
      <Typography color="primary" sx={{ fontWeight: 500, fontSize: 12 }}>
        {lastLabel}
      </Typography>
    </Breadcrumbs>
  );
}

export default AutoBreadcrumbs;

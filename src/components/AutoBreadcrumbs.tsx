import {useMemo} from 'react';
import {useNavigate} from 'react-router';
import Breadcrumbs from '@mui/joy/Breadcrumbs';
import Link from '@mui/joy/Link';
import Typography from '@mui/joy/Typography';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

// Карта маршрутов — можно расширять
const PATH_LABELS: Record<string, string> = {
    '/': 'Главная',
    '/users': 'Пользователи',
    '/users/:id': 'Профиль пользователя',
    '/profile': "Мой профиль",
    '/dashboards': "Дашборды"
};

// Проверяет, совпадает ли путь с шаблоном (например, /users/:id)
function matchRoute(path: string, pattern: string): boolean {
    const regexPattern = pattern
        .replace(/:[a-zA-Z0-9_]+/g, '[^/]+') // заменяем :id на [^/]+
        .replace(/\//g, '\\/'); // экранируем слэши
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
}

function AutoBreadcrumbs() {
    const navigate = useNavigate();

    const {breadcrumbs, lastLabel} = useMemo(() => {
        const pathSnippets = window.location.pathname.split('/').filter((i) => i);
        const breadcrumbsArray: BreadcrumbItem[] = [
            {label: 'Главная', href: '/'},
        ];

        let currentPath = '';

        for (let i = 0; i < pathSnippets.length; i++) {
            const snippet = pathSnippets[i];
            currentPath += `/${snippet}`;

            // Ищем точное совпадение
            if (PATH_LABELS[currentPath]) {
                breadcrumbsArray.push({
                    label: PATH_LABELS[currentPath],
                    href: currentPath,
                });
            } else {
                // Проверяем, есть ли шаблон в PATH_LABELS, например, /users/:id
                const matchedPattern = Object.keys(PATH_LABELS).find((pattern) =>
                    matchRoute(currentPath, pattern)
                );

                if (matchedPattern) {
                    breadcrumbsArray.push({
                        label: PATH_LABELS[matchedPattern],
                        href: currentPath,
                    });
                } else {
                    // Если нет шаблона, используем сам сегмент (например, ID)
                    breadcrumbsArray.push({
                        label: decodeURIComponent(snippet),
                        href: currentPath,
                    });
                }
            }
        }

        // Последний элемент — не ссылка
        const lastBreadcrumb = breadcrumbsArray.pop();
        const lastLabel = lastBreadcrumb?.label || '';

        return {breadcrumbs: breadcrumbsArray, lastLabel};
    }, []);

    const handleClick = (href: string) => {
        navigate(href);
    };

    return (
        <Breadcrumbs
            size="sm"
            aria-label="breadcrumbs"
            separator={<ChevronRightRoundedIcon/>}
            sx={{pl: 0}}
        >
            {breadcrumbs.map((crumb, index) => (
                <Link
                    key={crumb.href}
                    underline="hover"
                    color="neutral"
                    onClick={() => handleClick(crumb.href!)}
                    sx={{fontSize: 12, fontWeight: 500, cursor: 'pointer'}}
                >
                    {index === 0 ? <HomeRoundedIcon /*fontSize="sm"*/ /> : crumb.label}
                </Link>
            ))}
            <Typography color="primary" sx={{fontWeight: 500, fontSize: 12}}>
                {lastLabel}
            </Typography>
        </Breadcrumbs>
    );
}

export default AutoBreadcrumbs;
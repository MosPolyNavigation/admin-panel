import * as React from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Checkbox from '@mui/joy/Checkbox';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import ColorSchemeToggle from "../components/ColorSchemeToggle.tsx";
import IconButton from "@mui/joy/IconButton";
import {useAuth} from "../contexts/AuthContext.tsx";
import {Navigate} from "react-router";
import Alert from '@mui/joy/Alert';
import WarningIcon from '@mui/icons-material/Warning';

interface FormElements extends HTMLFormControlsCollection {
    login: HTMLInputElement;
    password: HTMLInputElement;
    persistent: HTMLInputElement;
}
interface SignInFormElement extends HTMLFormElement {
    readonly elements: FormElements;
}

export default function SingIn() {
    const { login, isAuthenticated } = useAuth();
    const [error, setError] = React.useState<string>('');

    if (isAuthenticated) return <Navigate to="/" replace/>

    const handleSubmit = async (event: React.FormEvent<SignInFormElement>) => {
        event.preventDefault();
        setError('');
        const formElements = event.currentTarget.elements;
        const username = formElements.login.value;
        const password = formElements.password.value;

        try {
            await login({ username, password });
        } catch (error) {
            console.error('Login failed:', error);
            setError('Неверный логин или пароль');
        }
    };

    return (
        <>
            <Box
                sx={(theme) => ({
                    width: { xs: '100%', md: '50vw' },
                    transition: 'width var(--Transition-duration)',
                    transitionDelay: 'calc(var(--Transition-duration) + 0.1s)',
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    backdropFilter: 'blur(12px)',
                    backgroundColor: 'rgba(255 255 255 / 0.2)',
                    [theme.getColorSchemeSelector('dark')]: {
                        backgroundColor: 'rgba(19 19 24 / 0.4)',
                    },
                })}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '100dvh',
                        width: '100%',
                        px: 2,
                    }}
                >
                    <Box
                        component="header"
                        sx={{ py: 3, display: 'flex', justifyContent: 'space-between' }}
                    >
                        <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
                            <IconButton variant="soft" color="primary" size="sm">
                                <BadgeRoundedIcon />
                            </IconButton>
                            <Typography level="title-lg">PolyNavigation</Typography>
                        </Box>
                        <ColorSchemeToggle />
                    </Box>
                    <Box
                        component="main"
                        sx={{
                            my: 'auto',
                            py: 2,
                            pb: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            width: 400,
                            maxWidth: '100%',
                            mx: 'auto',
                            borderRadius: 'sm',
                            '& form': {
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                            },
                            [`& .MuiFormLabel-asterisk`]: {
                                visibility: 'hidden',
                            },
                        }}
                    >
                        <Stack sx={{ gap: 4, mb: 2 }}>
                            <Stack sx={{ gap: 1 }}>
                                <Typography component="h1" level="h3">
                                    Войти
                                </Typography>
                            </Stack>
                        </Stack>

                        {error && (
                            <Alert
                                color="danger"
                                variant="soft"
                                startDecorator={<WarningIcon />}
                                sx={{ mb: 2 }}
                            >
                                {error}
                            </Alert>
                        )}
                            

                        <Stack sx={{ gap: 4, mt: 2 }}>
                            <form onSubmit={handleSubmit}>
                                <FormControl required>
                                    <FormLabel>Login</FormLabel>
                                    <Input type="text" name="login" />
                                </FormControl>
                                <FormControl required>
                                    <FormLabel>Password</FormLabel>
                                    <Input type="password" name="password" />
                                </FormControl>
                                <Stack sx={{ gap: 4, mt: 2 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Checkbox size="sm" label="Remember me" name="persistent" />
                                    </Box>
                                    <Button type="submit" fullWidth>
                                        Войти
                                    </Button>
                                </Stack>
                            </form>
                        </Stack>
                    </Box>
                    <Box component="footer" sx={{ py: 3 }}>
                        <Typography level="body-xs" sx={{ textAlign: 'center' }}>
                            © Mospolynavigation {new Date().getFullYear()}
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <Box
                sx={{
                    height: '100%',
                    position: 'fixed',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    left: { xs: 0, md: '50vw' },
                    transition:
                        'background-image var(--Transition-duration), left var(--Transition-duration) !important',
                    transitionDelay: 'calc(var(--Transition-duration) + 0.1s)',
                    backgroundColor: 'background.level1',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            />
        </>
    );
}
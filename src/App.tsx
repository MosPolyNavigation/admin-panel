import {CssVarsProvider as JoyCssVarsProvider, extendTheme} from '@mui/joy/styles';
import {createTheme, THEME_ID as MATERIAL_THEME_ID} from '@mui/material/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import {BrowserRouter, Routes, Route} from 'react-router';

import SignIn from './pages/SignIn.tsx'
import Layout from "./components/Layout.tsx";
import Home from "./pages/Home.tsx";
import Profile from "./pages/Profile.tsx";
import Users from "./pages/Users.tsx"
import {AuthProvider} from "./contexts/AuthContext.tsx";
import Dashboard from "./pages/Dashboard.tsx";

const materialTheme = createTheme({
    palette: {
        mode: 'dark'
    }
});

const joyTheme = extendTheme({
    [MATERIAL_THEME_ID]: materialTheme
})

export default function App() {
    return (
        <JoyCssVarsProvider disableTransitionOnChange defaultColorScheme={'dark'} theme={joyTheme}>
            <CssBaseline/>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<SignIn/>}/>
                        <Route path="/" element={<Layout/>}>
                            <Route index element={<Home/>}/>
                            <Route path="dashboards" element={<Dashboard/>}/>
                            <Route path="users">
                                <Route index element={<Users/>}/>
                                <Route path=":id" element={<Profile/>}/>
                            </Route>
                            <Route path="profile" element={<Profile/>}/>
                        </Route>
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </JoyCssVarsProvider>
    );
}

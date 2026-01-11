import {CssVarsProvider as JoyCssVarsProvider} from '@mui/joy/styles'
import CssBaseline from '@mui/joy/CssBaseline';
import {BrowserRouter, Routes, Route} from 'react-router';

import SignIn from './pages/SignIn.tsx'
import Layout from "./components/Layout.tsx";
import Home from "./pages/Home.tsx";
import Profile from "./pages/Profile.tsx";
import Users from "./pages/Users.tsx"
import UserEditPage from './pages/UserEditPage.tsx';
import Role from './pages/Role.tsx'
import RoleEditPage from './pages/RoleEditPage.tsx';
import ReviewsPage from './pages/ReviewsPage.tsx';
import ReviewPage from './pages/ReviewPage.tsx';
import {AuthProvider} from "./contexts/AuthContext.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import {BASE_PATH} from "./config.ts";

export default function App() {
    return (
        <JoyCssVarsProvider disableTransitionOnChange defaultMode={'dark'}>
            <CssBaseline/>
            <BrowserRouter basename={BASE_PATH}>
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
                            <Route path="UserEditPage" element={<UserEditPage />} />
                            <Route path="roles" element={<Role />}/>
                            <Route path="RoleEditPage" element={<RoleEditPage />} />
                            <Route path="reviews">
                                <Route index element={<ReviewsPage />}/>
                                <Route path=":id" element={<ReviewPage />}/>
                            </Route>
                        </Route>
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </JoyCssVarsProvider>
    );
}

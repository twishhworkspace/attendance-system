import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    Users, 
    Briefcase, 
    MapPin, 
    FileText, 
    ShieldCheck, 
    Settings, 
    LogOut,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';

import LandingView from './views/LandingView';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView'; // Verified
import PersonnelView from './views/PersonnelView'; // Restoration Complete
import DepartmentsView from './views/DepartmentsView'; 
import OfficesView from './views/OfficesView'; 
import ReportsView from './views/ReportsView'; // Verified Imports
import RequestsView from './views/RequestsView';
import SettingsView from './views/SettingsView';
import PunchTerminal from './views/PunchTerminal';
import CompanySupportView from './views/CompanySupportView';
import SpatialIntelView from './views/SpatialIntelView';

import MasterAdminView from './views/MasterAdminView';

// Components
import GlobalSidebar from './components/GlobalSidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';

// Hooks
import { useOfflineSync } from './hooks/useOfflineSync';

const AppContent = () => {
    const { user, login, signup, logout, loading } = useAuth();
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    const [view, setView] = useState(isStandalone ? 'login' : 'landing');
    const [selectedUser, setSelectedUser] = useState("");
    const [range, setRange] = useState('all');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [globalSearch, setGlobalSearch] = useState('');
    const [biometricEmail, setBiometricEmail] = useState(localStorage.getItem('twishh_last_email') || '');

    useOfflineSync(); 

    useEffect(() => {
        if (!user) {
            // In standalone mode, we prefer staying on login/signup
            if (isStandalone) {
                if (view !== 'login' && view !== 'signup') setView('login');
            } else {
                if (view !== 'login' && view !== 'signup') setView('landing');
            }
        }
        else if (user.role === 'SUPER_ADMIN') setView('master-dashboard');
        else if (user.role === 'EMPLOYEE') setView('terminal');
        else {
            setView('dashboard');
            setSidebarOpen(false); // Close sidebar on view change
        }
    }, [user, isStandalone]);

    useEffect(() => {
        setSidebarOpen(false); // Close sidebar when view changes
    }, [view]);

    const handleNavigateToReport = (userId) => {
        setSelectedUser(userId);
        setView('reports');
    };

    let content;
    if (loading) {
        content = (
            <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-violet-500 mb-6" size={48} />
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse text-slate-500">Stabilizing Environment</h2>
            </div>
        );
    } else if (!user) {
        if (view === 'login') {
            content = (
                <LoginView 
                    biometricEmail={biometricEmail} 
                    setBiometricEmail={setBiometricEmail}
                    onBack={() => setView('landing')}
                    isStandalone={isStandalone}
                />
            );
        } else {
            content = (
                <LandingView 
                    onLogin={() => setView('login')} 
                    onSignup={async (data) => {
                        if (data) await signup(data);
                        else setView('login');
                    }} 
                />
            );
        }
    } else {
        content = (
            <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-violet-500/30 overflow-hidden relative">
                <GlobalSidebar 
                    user={user} 
                    view={view} 
                    setView={setView} 
                    onLogout={logout} 
                    isOpen={sidebarOpen} 
                    setIsOpen={setSidebarOpen} 
                />
                
                <main className="flex-1 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />
                    <Topbar user={user} view={view} setView={setView} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                    
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 p-4 md:p-8 overflow-y-auto relative z-10"
                        >
                            {/* Master Controller Routes */}
                            {['master-dashboard', 'master-companies', 'support-hub', 'broadcasts', 'master-alerts', 'master-profile'].includes(view) && <MasterAdminView currentView={view} setGlobalView={setView} />}

                            {/* Standard Admin Routes */}
                            {view === 'dashboard' && <DashboardView />}
                            {view === 'personnel' && <PersonnelView onNavigateToReport={handleNavigateToReport} globalSearch={globalSearch} />}
                            {view === 'departments' && <DepartmentsView />}
                            {view === 'offices' && <OfficesView />}
                            {view === 'reports' && (
                                <ReportsView 
                                    selectedUser={selectedUser} 
                                    setSelectedUser={setSelectedUser}
                                    range={range}
                                    setRange={setRange}
                                    customDates={customDates}
                                    setCustomDates={setCustomDates}
                                    globalSearch={globalSearch}
                                />
                            )}
                            {view === 'spatial-intel' && <SpatialIntelView />}
                            {view === 'requests' && <RequestsView />}
                            {view === 'support' && <CompanySupportView />}
                            {view === 'terminal' && <PunchTerminal setView={setView} />}
                            {view === 'settings' && <SettingsView />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        );
    }

    return (
        <>
            {content}
            <ToastContainer />
        </>
    );
};

const App = () => (
    <AuthProvider>
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    </AuthProvider>
);

export default App;

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Lazy-loaded Views for Instant Initial Bundle Loading
const LandingView = lazy(() => import('./views/LandingView'));
const LoginView = lazy(() => import('./views/LoginView'));
const DashboardView = lazy(() => import('./views/DashboardView')); 
const PersonnelView = lazy(() => import('./views/PersonnelView')); 
const DepartmentsView = lazy(() => import('./views/DepartmentsView')); 
const ReportsView = lazy(() => import('./views/ReportsView')); 
const RequestsView = lazy(() => import('./views/RequestsView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const PunchTerminal = lazy(() => import('./views/PunchTerminal'));
const CompanySupportView = lazy(() => import('./views/CompanySupportView'));
const SpatialIntelView = lazy(() => import('./views/SpatialIntelView'));
const NoticesView = lazy(() => import('./views/NoticesView'));
const ExpenseTrackerView = lazy(() => import('./views/ExpenseTrackerView'));
const AdminExpensesView = lazy(() => import('./views/AdminExpensesView'));
const MasterAdminView = lazy(() => import('./views/MasterAdminView'));

// Components
import GlobalSidebar from './components/GlobalSidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';

// Hooks
import { useOfflineSync } from './hooks/useOfflineSync';
import { useAutoLogout } from './hooks/useAutoLogout';

const ViewLoader = () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
);

const AppContent = () => {
    const { user, signup, logout, loading } = useAuth();
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    const [view, setView] = useState(isStandalone ? 'login' : 'landing');
    const [selectedUser, setSelectedUser] = useState("");
    const [range, setRange] = useState('all');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [globalSearch, setGlobalSearch] = useState('');

    useOfflineSync(); 
    useAutoLogout(14400000); // 4 hour inactivity timeout

    useEffect(() => {
        if (loading) return;

        if (!user) {
            localStorage.removeItem('activeView');
            if (isStandalone) {
                if (view !== 'login' && view !== 'signup') setView('login');
            } else {
                if (view !== 'login' && view !== 'signup') setView('landing');
            }
        }
        else if (user.role === 'SUPER_ADMIN') {
            const saved = localStorage.getItem('activeView');
            const superAdminViews = ['master-dashboard', 'master-companies', 'support-hub', 'broadcasts', 'master-alerts', 'master-profile'];
            if (saved && superAdminViews.includes(saved)) {
                setView(saved);
            } else {
                setView('master-dashboard');
            }
        }
        else if (user.role === 'EMPLOYEE') {
            const allowedEmployeeViews = ['terminal', 'settings', 'notices'];
            if (user.expenseEnabled) {
                allowedEmployeeViews.push('expenses');
            }
            if (!allowedEmployeeViews.includes(view)) {
                setView('terminal');
            }
        }
        else {
            const saved = localStorage.getItem('activeView');
            const adminViews = ['dashboard', 'personnel', 'departments', 'reports', 'spatial-intel', 'requests', 'support', 'settings', 'notices', 'admin-expenses'];
            if (saved && adminViews.includes(saved)) {
                setView(saved);
            } else {
                setView('dashboard');
            }
            setSidebarOpen(false);
        }
    }, [user, isStandalone, loading]);

    useEffect(() => {
        if (user && view && view !== 'login' && view !== 'signup' && view !== 'landing') {
            localStorage.setItem('activeView', view);
        }
        setSidebarOpen(false); 
    }, [view, user]);

    const handleNavigateToReport = (userId) => {
        setSelectedUser(userId);
        setView('reports');
    };

    let content;
    if (loading) {
        content = (
            <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center relative select-none overflow-hidden">
                {/* Global Bloom Glares */}
                <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-violet-500/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="flex flex-col items-center z-10">
                    {/* Brand Logo & Name */}
                    <div className="flex items-center gap-2.5 mb-8">
                        <div className="w-[42px] h-[42px] flex items-center justify-center overflow-hidden animate-pulse">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex items-center text-[20px] font-black tracking-tighter leading-none italic uppercase">
                            <span className="text-white skew-x-[-12deg] inline-block">TWISHH</span>
                            <span className="text-[#eab308] skew-x-[-12deg] inline-block ml-1">SYNC</span>
                        </div>
                    </div>

                    {/* Sliding Horizontal Line Loader Track */}
                    <div className="w-56 h-[3px] bg-slate-800/80 rounded-full overflow-hidden relative mb-4">
                        <motion.div 
                            className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500 w-1/3 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                            animate={{
                                left: ["-35%", "100%"]
                            }}
                            transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </div>

                    {/* Status Text */}
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse italic">
                        Synchronizing Cluster...
                    </p>
                </div>
            </div>
        );
    } else if (!user) {
        if (view === 'login') {
            content = (
                <Suspense fallback={<ViewLoader />}>
                    <LoginView 
                        onBack={() => setView('landing')}
                        isStandalone={isStandalone}
                    />
                </Suspense>
            );
        } else {
            content = (
                <Suspense fallback={<ViewLoader />}>
                    <LandingView 
                        onLogin={() => setView('login')} 
                        onSignup={async (data) => {
                            if (data) await signup(data);
                            else setView('login');
                        }} 
                    />
                </Suspense>
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
                            <Suspense fallback={<ViewLoader />}>
                                {['master-dashboard', 'master-companies', 'support-hub', 'broadcasts', 'master-alerts', 'master-profile'].includes(view) && <MasterAdminView currentView={view} setGlobalView={setView} />}

                                {view === 'dashboard' && <DashboardView />}
                                {view === 'personnel' && <PersonnelView onNavigateToReport={handleNavigateToReport} globalSearch={globalSearch} />}
                                {view === 'departments' && <DepartmentsView />}
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
                                {view === 'notices' && <NoticesView />}
                                {view === 'expenses' && <ExpenseTrackerView />}
                                {view === 'admin-expenses' && <AdminExpensesView />}
                            </Suspense>
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

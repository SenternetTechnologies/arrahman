
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as api from './services/api';
import type { Site, Worker, Material, Page, HomeTab, WorkerSubTab, MaterialSubTab, SiteDetailTab, ModalType, SiteDetailsData, DashboardData, TodayWorker, OverallMaterialLog } from './types';
import { HomeIcon, ChartIcon, AddIcon, BackIcon, CheckCircleIcon, LocationIcon, UploadCloudIcon } from './components/Icons';

// --- UTILITY FUNCTIONS ---
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
const getTodayDate = () => new Date().toISOString().split('T')[0];

// --- APP COMPONENT ---
export default function App() {
    // Global State
    const [page, setPage] = useState<Page>('home');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: 'success' });

    // Data State
    const [sites, setSites] = useState<Site[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [currentSiteId, setCurrentSiteId] = useState<string | null>(null);
    const [siteDetails, setSiteDetails] = useState<SiteDetailsData | null>(null);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [todayWorkers, setTodayWorkers] = useState<TodayWorker[]>([]);
    const [materialLogs, setMaterialLogs] = useState<OverallMaterialLog[]>([]);
    
    // UI State
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [homeTab, setHomeTab] = useState<HomeTab>('sites');
    const [workerSubTab, setWorkerSubTab] = useState<WorkerSubTab>('today');
    const [materialSubTab, setMaterialSubTab] = useState<MaterialSubTab>('log');
    const [siteDetailTab, setSiteDetailTab] = useState<SiteDetailTab>('log');

    // --- DATA FETCHING ---
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
    };
    
    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getInitialData();
            setSites(data.sites);
            setWorkers(data.workers);
            setMaterials(data.materials);
            await Promise.all([
                loadTodayWorkers(),
                loadMaterialLogs()
            ]);
        } catch (error) {
            showToast('Failed to load initial data.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadTodayWorkers = async () => {
        try {
            const data = await api.getTodayWorkers();
            setTodayWorkers(data);
        } catch { showToast('Could not load today\'s workers', 'error'); }
    }

    const loadMaterialLogs = async () => {
        try {
            const data = await api.getOverallMaterialsLog();
            setMaterialLogs(data);
        } catch { showToast('Could not load material logs', 'error'); }
    }

    useEffect(() => {
        loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNavigate = (newPage: Page, siteId: string | null = null) => {
        setPage(newPage);
        setCurrentSiteId(siteId);
        window.scrollTo(0, 0);

        if (newPage === 'site-details' && siteId) {
            setLoading(true);
            api.getSiteDetails(siteId)
                .then(setSiteDetails)
                .catch(() => {
                    showToast('Failed to load site details.', 'error');
                    setPage('home'); // Go back if failed
                })
                .finally(() => setLoading(false));
        }
        if (newPage === 'profile') {
            setLoading(true);
            api.getProfileDashboardData()
                .then(setDashboardData)
                .catch(() => showToast('Failed to load dashboard data.', 'error'))
                .finally(() => setLoading(false));
        }
        if (newPage === 'home') {
            setCurrentSiteId(null);
            setSiteDetails(null);
        }
    };

    // --- RENDER LOGIC ---
    return (
        <div className="h-screen w-screen flex flex-col bg-gray-100">
            <Header page={page} onBack={() => handleNavigate('home')} siteName={siteDetails?.site.SiteName}/>
            
            <main className="flex-1 overflow-y-auto pb-20">
                {page === 'home' && (
                    <HomePage 
                        sites={sites} workers={workers} materials={materials}
                        todayWorkers={todayWorkers} materialLogs={materialLogs}
                        onViewSite={(id) => handleNavigate('site-details', id)}
                        onUpdate={loadInitialData}
                        showToast={showToast}
                        setLoading={setLoading}
                        setActiveModal={setActiveModal}
                        tabs={{homeTab, setHomeTab, workerSubTab, setWorkerSubTab, materialSubTab, setMaterialSubTab}}
                    />
                )}
                {page === 'site-details' && siteDetails && (
                   <SiteDetailsPage 
                        details={siteDetails} 
                        workers={workers} 
                        materials={materials} 
                        tab={siteDetailTab} 
                        setTab={setSiteDetailTab}
                        setActiveModal={setActiveModal}
                    />
                )}
                {page === 'profile' && dashboardData && <ProfilePage data={dashboardData} />}
            </main>

            <BottomNav currentPage={page} onNavigate={handleNavigate} />

            <ModalManager 
                activeModal={activeModal} 
                setActiveModal={setActiveModal} 
                onUpdate={loadInitialData}
                currentSiteId={currentSiteId}
                showToast={showToast}
                workers={workers}
                materials={materials}
            />

            {loading && <GlobalLoader />}
            <Toast message={toast.message} type={toast.type} />
        </div>
    );
}

// --- SUB-COMPONENTS ---
// To avoid re-declaring on every App render, they are defined outside the main component.

// LAYOUT
const Header: React.FC<{ page: Page; onBack: () => void; siteName?: string }> = ({ page, onBack, siteName }) => {
    const titles = {
        home: 'Ar-Rahman Construction',
        'site-details': siteName || 'Site Details',
        profile: 'Profile & Dashboard',
    };
    return (
        <header className="bg-teal-800 text-white p-4 shadow-md flex items-center sticky top-0 z-30">
            {page === 'site-details' && (
                <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-teal-700">
                    <BackIcon className="w-6 h-6" />
                </button>
            )}
            <h1 className="text-xl font-bold truncate">{titles[page]}</h1>
        </header>
    );
};

const BottomNav: React.FC<{ currentPage: Page; onNavigate: (page: Page) => void }> = ({ currentPage, onNavigate }) => {
    const navItems = [
        { id: 'home', icon: HomeIcon, label: 'Home' },
        { id: 'profile', icon: ChartIcon, label: 'Profile' },
    ];
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex h-16 z-30">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => onNavigate(item.id as Page)}
                    className={`flex flex-col items-center justify-center w-full h-full transition-colors ${currentPage === item.id ? 'text-teal-600' : 'text-gray-500'}`}
                >
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs mt-1">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

const Fab: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="fixed bottom-20 right-6 bg-teal-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 z-20">
        <AddIcon className="w-8 h-8" />
    </button>
);

// UI Elements
const GlobalLoader = () => (
    <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const Toast: React.FC<{ message: string; type: 'success' | 'error' }> = ({ message, type }) => {
    if (!message) return null;
    const bgColor = type === 'error' ? 'bg-red-600' : 'bg-gray-900';
    return (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-full shadow-lg z-50 transition-opacity duration-300 ${message ? 'opacity-100' : 'opacity-0'} ${bgColor}`}>
            {message}
        </div>
    );
};

// ... More components to be defined here for HomePage, SiteDetailsPage, ProfilePage, and Modals ...
// For brevity, this is a conceptual structure. The final implementation might combine these into larger component files.
// Let's create the Pages and Modals here as well for a single-file structure approach.

const HomePage: React.FC<{
    sites: Site[]; workers: Worker[]; materials: Material[];
    todayWorkers: TodayWorker[]; materialLogs: OverallMaterialLog[];
    onViewSite: (id: string) => void; onUpdate: () => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
    setLoading: (loading: boolean) => void;
    setActiveModal: (modal: ModalType) => void;
    tabs: { 
        homeTab: HomeTab; setHomeTab: (t: HomeTab) => void; 
        workerSubTab: WorkerSubTab; setWorkerSubTab: (t: WorkerSubTab) => void;
        materialSubTab: MaterialSubTab; setMaterialSubTab: (t: MaterialSubTab) => void;
    }
}> = (props) => {
    const { sites, workers, materials, todayWorkers, materialLogs, onViewSite, onUpdate, showToast, setLoading, setActiveModal, tabs } = props;
    const { homeTab, setHomeTab, workerSubTab, setWorkerSubTab, materialSubTab, setMaterialSubTab } = tabs;
    
    const handleToggleStatus = async (siteId: string, currentStatus: 'Online' | 'Offline') => {
        const newStatus = currentStatus === 'Online' ? 'Offline' : 'Online';
        setLoading(true);
        try {
            await api.updateSiteStatus(siteId, newStatus);
            showToast(`Site set to ${newStatus}`);
            onUpdate();
        } catch {
            showToast('Failed to update status', 'error');
        } finally {
            setLoading(false);
        }
    }

    const fabAction = useMemo(() => {
        switch(homeTab) {
            case 'sites': return () => setActiveModal('add-site');
            case 'workers':
                return workerSubTab === 'overall' ? () => setActiveModal('add-worker') : undefined;
            case 'materials':
                return materialSubTab === 'master' ? () => setActiveModal('add-material-type') : undefined;
            default: return undefined;
        }
    }, [homeTab, workerSubTab, materialSubTab, setActiveModal]);
    
    return (
        <div>
            <Tabs items={['Sites', 'Workers', 'Materials']} selected={homeTab} onSelect={(val) => setHomeTab(val.toLowerCase() as HomeTab)} />
            
            <div className="p-4">
                {homeTab === 'sites' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sites.length > 0 ? sites.map(site => (
                            <div key={site.SiteID} className="bg-white rounded-lg shadow-md p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-teal-700">{site.SiteName}</h3>
                                        <p className="text-sm text-gray-600">{site.Location}</p>
                                    </div>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={site.Status === 'Online'} onChange={() => handleToggleStatus(site.SiteID, site.Status)} className="sr-only peer"/>
                                        <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                    </label>
                                </div>
                                <button onClick={() => onViewSite(site.SiteID)} className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg font-medium transition-colors hover:bg-teal-700 text-sm">View Details</button>
                            </div>
                        )) : <p className="text-gray-500 col-span-full text-center">No sites found. Click '+' to add one.</p>}
                    </div>
                )}

                {homeTab === 'workers' && (
                    <div>
                        <Tabs items={["Today's Workers", "Overall Workers"]} selected={workerSubTab === 'today' ? "Today's Workers" : "Overall Workers"} onSelect={(val) => setWorkerSubTab(val.startsWith('Today') ? 'today' : 'overall')} isSubTab />
                        <div className="pt-4 space-y-3">
                            {workerSubTab === 'today' && (todayWorkers.length > 0 ? todayWorkers.map(w => (
                                <div key={w.LogID} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{w.WorkerName}</p>
                                        <p className="text-sm text-gray-600">Site: {w.SiteName}</p>
                                    </div>
                                    {w.PaidStatus ? <span className="text-green-600 font-medium flex items-center text-sm"><CheckCircleIcon className="w-4 h-4 mr-1"/> Paid</span> : <span className="text-red-600 font-medium text-sm">Unpaid</span>}
                                </div>
                            )) : <p className="text-gray-500 text-center">No workers active on sites today.</p>)}
                            
                            {workerSubTab === 'overall' && (workers.length > 0 ? workers.map(w => (
                                <div key={w.WorkerID} className="bg-white rounded-lg shadow p-4">
                                    <p className="font-medium">{w.WorkerName}</p>
                                    <p className="text-sm text-gray-500">Default Wage: {formatCurrency(w.DefaultDailyWage)}</p>
                                </div>
                            )) : <p className="text-gray-500 text-center">No workers in master list.</p>)}
                        </div>
                    </div>
                )}

                {homeTab === 'materials' && (
                    <div>
                        <Tabs items={["Usage Log", "Master List"]} selected={materialSubTab === 'log' ? "Usage Log" : "Master List"} onSelect={(val) => setMaterialSubTab(val.startsWith('Usage') ? 'log' : 'master')} isSubTab />
                         <div className="pt-4 space-y-3">
                            {materialSubTab === 'log' && (materialLogs.length > 0 ? materialLogs.map(log => (
                                 <div key={log.LogID} className="bg-white rounded-lg shadow p-4">
                                     <p className="font-medium">{log.MaterialName} <span className="text-sm text-gray-600">({log.QuantityUsed} {log.Unit})</span></p>
                                     <p className="text-sm text-gray-600">Site: {log.SiteName}</p>
                                 </div>
                            )) : <p className="text-gray-500 text-center">No material usage logged yet.</p>)}
                             {materialSubTab === 'master' && (materials.length > 0 ? materials.map(m => (
                                 <div key={m.MaterialID} className="bg-white rounded-lg shadow p-4">
                                     <p className="font-medium">{m.MaterialName}</p>
                                     <p className="text-sm text-gray-500">Value: {formatCurrency(m.DefaultValue)} / {m.Unit}</p>
                                 </div>
                             )) : <p className="text-gray-500 text-center">No materials in master list.</p>)}
                        </div>
                    </div>
                )}
            </div>
            
            {fabAction && <Fab onClick={fabAction} />}
        </div>
    );
}

const SiteDetailsPage: React.FC<{
    details: SiteDetailsData; workers: Worker[]; materials: Material[];
    tab: SiteDetailTab; setTab: (t: SiteDetailTab) => void;
    setActiveModal: (modal: ModalType) => void;
}> = ({ details, workers, materials, tab, setTab, setActiveModal }) => {
    const { site, logs, workerLogs, materialLogs, gallery, expenses } = details;

    const FileButton: React.FC<{ fileId?: string; text: string; type: string }> = ({ fileId, text, type }) => {
        if (fileId) {
            return <a href="#" onClick={(e) => e.preventDefault()} className="bg-gray-200 text-gray-800 py-2 px-3 rounded-lg font-medium text-sm text-center">View {text}</a>;
        }
        return <button onClick={() => setActiveModal('upload-file')} className="bg-teal-600 text-white py-2 px-3 rounded-lg font-medium text-sm">Upload {text}</button>;
    };

    return (
        <div className="bg-gray-100">
            <div className="p-4 bg-white m-4 rounded-lg shadow space-y-4">
                <h2 className="text-2xl font-bold text-teal-800">{site.SiteName}</h2>
                <p className="text-gray-600 flex items-center"><LocationIcon className="w-4 h-4 mr-2" /> {site.Location}</p>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-100 p-3 rounded-lg"><h4 className="text-sm font-medium text-gray-500">Budget</h4><p className="text-lg font-semibold">{formatCurrency(site.Budget)}</p></div>
                    <div className="bg-gray-100 p-3 rounded-lg"><h4 className="text-sm font-medium text-gray-500">Expenses</h4><p className="text-lg font-semibold text-red-600">{formatCurrency(expenses.totalExpenses)}</p></div>
                </div>

                 <div className="border-t pt-4">
                     <h3 className="text-lg font-semibold">Owner Details</h3>
                     <p className="text-gray-700">{site.OwnerName} - {site.OwnerContact}</p>
                 </div>
                 
                <div className="border-t pt-4 space-y-3">
                    <h3 className="text-lg font-semibold">Documents</h3>
                    <div className="flex space-x-2">
                        <FileButton fileId={site.AgreementFileID} text="Agreement" type="agreement" />
                        <FileButton fileId={site.SitePlanFileID} text="Site Plan" type="plan" />
                    </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Gallery</h3>
                        <button onClick={() => setActiveModal('upload-file')} className="text-teal-600 font-medium">Upload Image</button>
                    </div>
                    {gallery.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {gallery.map(img => <img key={img.ImageID} src={img.ImageUrl} alt={img.Description} className="w-full h-full object-cover rounded-lg aspect-square" />)}
                        </div>
                    ) : <p className="text-gray-500">No images uploaded.</p>}
                </div>
            </div>

            <div className="mt-2">
                <Tabs items={['Daily Log', 'Workers', 'Materials']} selected={tab.charAt(0).toUpperCase() + tab.slice(1)} onSelect={(val) => setTab(val.toLowerCase().replace(' ', '') as SiteDetailTab)} />
                <div className="p-4 space-y-3">
                    {tab === 'log' && <div><button onClick={() => setActiveModal('add-daily-log')} className="bg-teal-600 text-white py-2 px-4 rounded-lg font-medium text-sm mb-3">Add Log Entry</button> {logs.map(log => <div key={log.LogID} className="bg-white p-3 rounded-lg shadow-sm"><p className="font-medium text-gray-500 text-sm">{log.Date}</p><p>{log.LogEntry}</p></div>)}</div>}
                    {tab === 'workers' && <div><button onClick={() => setActiveModal('add-daily-worker')} className="bg-teal-600 text-white py-2 px-4 rounded-lg font-medium text-sm mb-3">Add Worker Entry</button> {workerLogs.map(log => <div key={log.LogID} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center"><div><p className="font-medium">{log.WorkerName}</p><p className="text-sm text-gray-600">{log.Date}</p></div><span className={`font-medium ${log.PaidStatus ? 'text-green-600' : 'text-red-600'}`}>{log.PaidStatus ? `Paid ${formatCurrency(log.SalaryPaid)}` : 'Unpaid'}</span></div>)}</div>}
                    {tab === 'materials' && <div><button onClick={() => setActiveModal('add-daily-material')} className="bg-teal-600 text-white py-2 px-4 rounded-lg font-medium text-sm mb-3">Add Material Entry</button> {materialLogs.map(log => <div key={log.LogID} className="bg-white p-3 rounded-lg shadow-sm"><p className="font-medium">{log.MaterialName} ({log.QuantityUsed} {log.Unit})</p><p className="text-sm text-gray-600">{log.Date} - Cost: {formatCurrency(log.TotalCost)}</p></div>)}</div>}
                </div>
            </div>
        </div>
    )
}

const ProfilePage: React.FC<{ data: DashboardData }> = ({ data }) => {
    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Company Dashboard</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow"><h3 className="font-medium text-gray-500">Online Sites</h3><p className="text-2xl font-bold text-green-600">{data.onlineSites}</p></div>
                <div className="bg-white p-4 rounded-lg shadow"><h3 className="font-medium text-gray-500">Offline Sites</h3><p className="text-2xl font-bold text-gray-600">{data.offlineSites}</p></div>
            </div>
             <div className="bg-white p-4 rounded-lg shadow space-y-2"><h3 className="text-lg font-semibold">Expenses</h3><div className="flex justify-between"><span className="text-gray-600">Today's Expense</span><span className="font-medium text-red-600">{formatCurrency(data.todayExpense)}</span></div><div className="flex justify-between"><span className="text-gray-600">This Month's Expense</span><span className="font-medium text-red-700">{formatCurrency(data.monthExpense)}</span></div></div>
             <div className="bg-white p-4 rounded-lg shadow space-y-2"><h3 className="text-lg font-semibold">Activity Today</h3><div className="flex justify-between"><span className="text-gray-600">Workers Active Today</span><span className="font-medium text-teal-600">{data.todayWorkers}</span></div><div className="flex justify-between"><span className="text-gray-600">Material Items Used</span><span className="font-medium text-teal-600">{data.todayMaterials}</span></div></div>
        </div>
    );
}

const Tabs: React.FC<{ items: string[], selected: string, onSelect: (item: string) => void, isSubTab?: boolean }> = ({ items, selected, onSelect, isSubTab }) => (
    <nav className={`bg-white shadow-sm sticky top-16 z-20 ${isSubTab ? 'top-28' : ''}`}>
        <div className="flex justify-around border-b border-gray-200">
            {items.map(item => (
                <button key={item} onClick={() => onSelect(item)} className={`px-4 py-3 font-medium text-sm transition-colors w-full ${selected.toLowerCase() === item.toLowerCase() ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-600 border-b-2 border-transparent'}`}>
                    {item}
                </button>
            ))}
        </div>
    </nav>
);

// --- MODALS ---

const Modal: React.FC<{ title: string; isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ title, isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
            <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg p-6 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <h2 className="text-xl font-semibold mb-4">{title}</h2>
                {children}
            </div>
        </>
    );
};

const ModalManager: React.FC<{
    activeModal: ModalType,
    setActiveModal: (modal: ModalType) => void;
    onUpdate: () => void;
    currentSiteId: string | null;
    showToast: (msg: string, type?: 'success'|'error') => void;
    workers: Worker[];
    materials: Material[];
}> = ({ activeModal, setActiveModal, onUpdate, currentSiteId, showToast, workers, materials }) => {
    const handleClose = () => setActiveModal(null);
    const formRef = useRef<HTMLFormElement>(null);
    
    useEffect(() => {
        if(activeModal) {
            formRef.current?.reset();
        }
    }, [activeModal]);

    const handleSubmit = async (e: React.FormEvent, apiCall: () => Promise<any>, successMsg: string) => {
        e.preventDefault();
        try {
            await apiCall();
            onUpdate();
            showToast(successMsg);
            handleClose();
        } catch {
            showToast('An error occurred.', 'error');
        }
    };
    
    return (
        <>
            <Modal title="Add New Site" isOpen={activeModal === 'add-site'} onClose={handleClose}>
                <form ref={formRef} onSubmit={(e) => {
                    const data = new FormData(e.currentTarget);
                    handleSubmit(e, () => api.addNewSite({
                        SiteName: data.get('SiteName') as string,
                        Location: data.get('Location') as string,
                        OwnerName: data.get('OwnerName') as string,
                        OwnerContact: data.get('OwnerContact') as string,
                        Budget: Number(data.get('Budget')),
                        TotalArea: data.get('TotalArea') as string
                    }), 'Site added successfully!');
                }} className="space-y-4">
                    <input name="SiteName" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Site Name" required />
                    <input name="Location" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Location" required />
                    <input name="OwnerName" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Owner Name" required />
                    <input name="OwnerContact" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Owner Contact" type="tel" required />
                    <input name="Budget" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Budget (₹)" type="number" required />
                    <input name="TotalArea" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Total Area (e.g., 2400 sqft)" required />
                    <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium">Add Site</button>
                    <button type="button" onClick={handleClose} className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium">Cancel</button>
                </form>
            </Modal>
            
            <Modal title="Add Daily Log" isOpen={activeModal === 'add-daily-log'} onClose={handleClose}>
                <form ref={formRef} onSubmit={e => {
                    const data = new FormData(e.currentTarget);
                    if (!currentSiteId) return;
                    handleSubmit(e, () => api.addDailyLog({
                        SiteID: currentSiteId,
                        Date: data.get('Date') as string,
                        LogEntry: data.get('LogEntry') as string,
                    }), 'Log added!')
                }} className="space-y-4">
                    <input name="Date" type="date" defaultValue={getTodayDate()} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                    <textarea name="LogEntry" rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter work description..." required></textarea>
                     <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium">Save Log</button>
                    <button type="button" onClick={handleClose} className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium">Cancel</button>
                </form>
            </Modal>

            <Modal title="Upload File" isOpen={activeModal === 'upload-file'} onClose={handleClose}>
                <form className="space-y-4" onSubmit={e => {
                     e.preventDefault();
                     if (!currentSiteId) return;
                     handleSubmit(e, () => api.uploadFile({name: 'mock.jpg'}, currentSiteId, 'gallery', 'Mock Description'), 'File uploaded!')
                }}>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500">
                        <UploadCloudIcon className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="mt-2 text-gray-600">Click to browse (mock upload)</p>
                    </div>
                     <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium">Upload</button>
                    <button type="button" onClick={handleClose} className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium">Cancel</button>
                </form>
            </Modal>
        </>
    );
};

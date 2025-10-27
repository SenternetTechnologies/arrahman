
import type { Site, Worker, Material, DailyLog, SiteWorkerLog, SiteMaterialLog, GalleryImage, SiteDetailsData, DashboardData, TodayWorker, OverallMaterialLog } from '../types';

// --- UTILS ---
const generateUUID = () => crypto.randomUUID();
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const apiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MOCK DATABASE ---
let sites: Site[] = [
    { SiteID: 's-1', SiteName: 'Greenwood Villa', Location: 'Koramangala, Bangalore', OwnerName: 'Mr. Sharma', OwnerContact: '9876543210', Budget: 5000000, TotalArea: '2400 sqft', Status: 'Online', AmountReceived: 2000000 },
    { SiteID: 's-2', SiteName: 'Prestige Apartments', Location: 'Whitefield, Bangalore', OwnerName: 'Ms. Gupta', OwnerContact: '8765432109', Budget: 12000000, TotalArea: '10000 sqft', Status: 'Online', AmountReceived: 5000000 },
    { SiteID: 's-3', SiteName: 'Commercial Complex', Location: 'Indiranagar, Bangalore', OwnerName: 'BuildCorp Inc.', OwnerContact: '7654321098', Budget: 25000000, TotalArea: '15000 sqft', Status: 'Offline', AmountReceived: 10000000 },
];

let workers: Worker[] = [
    { WorkerID: 'w-1', WorkerName: 'Ramesh Kumar', DefaultDailyWage: 800 },
    { WorkerID: 'w-2', WorkerName: 'Suresh Singh', Contact: '9988776655', DefaultDailyWage: 950 },
    { WorkerID: 'w-3', WorkerName: 'Vijay Prasad', DefaultDailyWage: 750 },
];

let materials: Material[] = [
    { MaterialID: 'm-1', MaterialName: 'Cement', Unit: 'bag', DefaultValue: 450 },
    { MaterialID: 'm-2', MaterialName: 'Steel Rod (12mm)', Unit: 'kg', DefaultValue: 85 },
    { MaterialID: 'm-3', MaterialName: 'Bricks', Unit: 'nos', DefaultValue: 12 },
];

let dailyLogs: DailyLog[] = [
    { LogID: 'dl-1', SiteID: 's-1', Date: '2023-10-26', LogEntry: 'Foundation work started. Excavation complete.' },
];

let siteWorkerLogs: SiteWorkerLog[] = [
    { LogID: 'swl-1', SiteID: 's-1', Date: getTodayDateString(), WorkerID: 'w-1', WorkerName: 'Ramesh Kumar', SalaryPaid: 800, PaidStatus: true },
    { LogID: 'swl-2', SiteID: 's-2', Date: getTodayDateString(), WorkerID: 'w-2', WorkerName: 'Suresh Singh', SalaryPaid: 0, PaidStatus: false },
];

let siteMaterialLogs: SiteMaterialLog[] = [
    { LogID: 'sml-1', SiteID: 's-1', Date: getTodayDateString(), MaterialID: 'm-1', MaterialName: 'Cement', Unit: 'bag', QuantityUsed: 50, DefaultValue: 450, TotalCost: 22500 },
];

let galleryImages: GalleryImage[] = [];

// --- API FUNCTIONS ---

export const getInitialData = async (): Promise<{ sites: Site[], workers: Worker[], materials: Material[] }> => {
    await apiDelay(500);
    return { sites, workers, materials };
};

export const addNewSite = async (siteData: Omit<Site, 'SiteID' | 'Status' | 'AmountReceived'>): Promise<Site> => {
    await apiDelay(300);
    const newSite: Site = {
        ...siteData,
        SiteID: generateUUID(),
        Status: 'Online',
        AmountReceived: 0,
    };
    sites.push(newSite);
    return newSite;
};

export const updateSiteStatus = async (siteId: string, status: 'Online' | 'Offline'): Promise<{ success: boolean }> => {
    await apiDelay(200);
    const site = sites.find(s => s.SiteID === siteId);
    if (site) {
        site.Status = status;
        return { success: true };
    }
    throw new Error('Site not found');
};

export const getSiteDetails = async (siteId: string): Promise<SiteDetailsData> => {
    await apiDelay(600);
    const site = sites.find(s => s.SiteID === siteId);
    if (!site) throw new Error('Site not found');

    const logs = dailyLogs.filter(l => l.SiteID === siteId).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
    const siteWorkers = siteWorkerLogs.filter(l => l.SiteID === siteId).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
    const siteMaterials = siteMaterialLogs.filter(l => l.SiteID === siteId).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
    const gallery = galleryImages.filter(g => g.SiteID === siteId).sort((a, b) => new Date(b.DateUploaded).getTime() - new Date(a.DateUploaded).getTime());

    const workerExpense = siteWorkers.reduce((acc, log) => acc + log.SalaryPaid, 0);
    const materialExpense = siteMaterials.reduce((acc, log) => acc + log.TotalCost, 0);

    return {
        site,
        logs,
        workerLogs: siteWorkers,
        materialLogs: siteMaterials,
        gallery,
        expenses: {
            totalExpenses: workerExpense + materialExpense,
            workerExpense,
            materialExpense,
        },
    };
};

export const getTodayWorkers = async (): Promise<TodayWorker[]> => {
    await apiDelay(400);
    const today = getTodayDateString();
    const onlineSiteIds = sites.filter(s => s.Status === 'Online').map(s => s.SiteID);
    
    return siteWorkerLogs
        .filter(log => log.Date === today && onlineSiteIds.includes(log.SiteID))
        .map(log => {
            const site = sites.find(s => s.SiteID === log.SiteID);
            const worker = workers.find(w => w.WorkerID === log.WorkerID);
            return {
                ...log,
                SiteName: site?.SiteName || 'Unknown Site',
                DefaultDailyWage: worker?.DefaultDailyWage || 0,
            };
        });
};

export const getOverallMaterialsLog = async (): Promise<OverallMaterialLog[]> => {
    await apiDelay(400);
    return [...siteMaterialLogs].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()).map(log => {
        const site = sites.find(s => s.SiteID === log.SiteID);
        return {
            ...log,
            SiteName: site?.SiteName || 'Unknown Site',
        }
    });
}

export const addNewWorker = async (workerData: Omit<Worker, 'WorkerID'>): Promise<Worker> => {
    await apiDelay(300);
    const newWorker: Worker = {
        ...workerData,
        WorkerID: generateUUID(),
    };
    workers.push(newWorker);
    return newWorker;
};

export const addNewMaterial = async (materialData: Omit<Material, 'MaterialID'>): Promise<Material> => {
    await apiDelay(300);
    const newMaterial: Material = {
        ...materialData,
        MaterialID: generateUUID(),
    };
    materials.push(newMaterial);
    return newMaterial;
};

export const addDailyLog = async (logData: Omit<DailyLog, 'LogID'>): Promise<DailyLog> => {
    await apiDelay(300);
    const newLog: DailyLog = { ...logData, LogID: generateUUID() };
    dailyLogs.push(newLog);
    return newLog;
};

export const addDailyWorker = async (logData: { SiteID: string; Date: string; WorkerID: string | null; WorkerName: string; newWorker: Omit<Worker, 'WorkerID'> | null }): Promise<{ newLog: SiteWorkerLog, newWorker: Worker | null }> => {
    await apiDelay(400);
    let workerId = logData.WorkerID;
    let newWorkerObj: Worker | null = null;
    
    if (logData.newWorker) {
        newWorkerObj = await addNewWorker(logData.newWorker);
        workerId = newWorkerObj.WorkerID;
    }

    if (!workerId) throw new Error("Worker ID is missing");

    const workerLog: SiteWorkerLog = {
        SiteID: logData.SiteID,
        Date: logData.Date,
        WorkerID: workerId,
        WorkerName: logData.WorkerName,
        SalaryPaid: 0,
        PaidStatus: false,
        LogID: generateUUID(),
    };
    siteWorkerLogs.push(workerLog);
    return { newLog: workerLog, newWorker: newWorkerObj };
};

export const addDailyMaterial = async (logData: Omit<SiteMaterialLog, 'LogID' | 'TotalCost'>): Promise<SiteMaterialLog> => {
    await apiDelay(300);
    const totalCost = logData.QuantityUsed * logData.DefaultValue;
    const newLog: SiteMaterialLog = {
        ...logData,
        TotalCost: totalCost,
        LogID: generateUUID(),
    };
    siteMaterialLogs.push(newLog);
    return newLog;
};

export const updateWorkerSalary = async (update: { logId: string; amount: number; status: boolean }): Promise<{ success: true }> => {
    await apiDelay(250);
    const log = siteWorkerLogs.find(l => l.LogID === update.logId);
    if (log) {
        log.SalaryPaid = update.amount;
        log.PaidStatus = update.status;
        return { success: true };
    }
    throw new Error('Worker log not found');
};

export const uploadFile = async (fileData: { name: string }, siteId: string, fileType: string, description: string): Promise<{ success: true }> => {
    await apiDelay(1000);
    const site = sites.find(s => s.SiteID === siteId);
    if (!site) throw new Error('Site not found');
    
    const fileId = `file-${generateUUID()}`;
    const imageUrl = `https://picsum.photos/seed/${fileId}/400/400`; // Mock image URL
    
    if (fileType === 'agreement') {
        site.AgreementFileID = fileId;
    } else if (fileType === 'plan') {
        site.SitePlanFileID = fileId;
    } else if (fileType === 'gallery') {
        galleryImages.push({
            ImageID: generateUUID(),
            SiteID: siteId,
            DateUploaded: getTodayDateString(),
            ImageFileID: fileId,
            ImageUrl: imageUrl,
            Description: description,
        });
    }
    return { success: true };
};

export const getProfileDashboardData = async (): Promise<DashboardData> => {
    await apiDelay(500);
    const today = new Date();
    const todayStr = getTodayDateString();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const onlineSites = sites.filter(s => s.Status === 'Online').length;
    const offlineSites = sites.length - onlineSites;
    const todayWorkers = siteWorkerLogs.filter(l => l.Date === todayStr).length;
    const todayMaterials = siteMaterialLogs.filter(l => l.Date === todayStr).length;

    let todayExpense = 0;
    let monthExpense = 0;

    siteWorkerLogs.forEach(log => {
        const logDate = new Date(log.Date);
        const expense = log.SalaryPaid || 0;
        if (log.Date === todayStr) todayExpense += expense;
        if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) monthExpense += expense;
    });
    siteMaterialLogs.forEach(log => {
        const logDate = new Date(log.Date);
        const expense = log.TotalCost || 0;
        if (log.Date === todayStr) todayExpense += expense;
        if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) monthExpense += expense;
    });

    return { onlineSites, offlineSites, todayWorkers, todayMaterials, todayExpense, monthExpense };
};

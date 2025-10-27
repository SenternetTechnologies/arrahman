export interface Site {
    SiteID: string;
    SiteName: string;
    Location: string;
    OwnerName: string;
    OwnerContact: string;
    Budget: number;
    TotalArea: string;
    Status: 'Online' | 'Offline';
    AmountReceived: number;
    AgreementFileID?: string;
    SitePlanFileID?: string;
    DriveFolderID?: string;
}

export interface Worker {
    WorkerID: string;
    WorkerName: string;
    Contact?: string;
    DefaultDailyWage: number;
}

export interface Material {
    MaterialID: string;
    MaterialName: string;
    Unit: string;
    DefaultValue: number;
}

export interface DailyLog {
    LogID: string;
    SiteID: string;
    Date: string; // YYYY-MM-DD
    LogEntry: string;
}

export interface SiteWorkerLog {
    LogID: string;
    SiteID: string;
    Date: string; // YYYY-MM-DD
    WorkerID: string;
    WorkerName: string;
    SalaryPaid: number;
    PaidStatus: boolean;
}

export interface SiteMaterialLog {
    LogID: string;
    SiteID: string;
    Date: string; // YYYY-MM-DD
    MaterialID: string;
    MaterialName: string;
    Unit: string;
    QuantityUsed: number;
    DefaultValue: number;
    TotalCost: number;
}

export interface GalleryImage {
    ImageID: string;
    SiteID: string;
    DateUploaded: string; // YYYY-MM-DD
    ImageFileID: string;
    ImageUrl: string;
    Description: string;
}

export interface SiteDetailsData {
    site: Site;
    logs: DailyLog[];
    workerLogs: SiteWorkerLog[];
    materialLogs: SiteMaterialLog[];
    gallery: GalleryImage[];
    expenses: {
        totalExpenses: number;
        workerExpense: number;
        materialExpense: number;
    };
}

export interface DashboardData {
    onlineSites: number;
    offlineSites: number;
    todayWorkers: number;
    todayMaterials: number;
    todayExpense: number;
    monthExpense: number;
}

export interface TodayWorker extends SiteWorkerLog {
    SiteName: string;
    DefaultDailyWage: number;
}

export interface OverallMaterialLog extends SiteMaterialLog {
    SiteName: string;
}

export type Page = 'home' | 'site-details' | 'profile';
export type HomeTab = 'sites' | 'workers' | 'materials';
export type WorkerSubTab = 'today' | 'overall';
export type MaterialSubTab = 'log' | 'master';
export type SiteDetailTab = 'log' | 'workers' | 'materials';

export type ModalType = 
    | 'add-site' 
    | 'add-worker' 
    | 'add-material-type' 
    | 'add-daily-log' 
    | 'add-daily-worker' 
    | 'add-daily-material'
    | 'update-salary' 
    | 'upload-file'
    | 'ai-analysis'
    | null;

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

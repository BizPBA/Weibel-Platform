import { defineStore } from 'pinia'

type Language = 'en' | 'da'

interface Translations {
  [key: string]: {
    [key: string]: string
  }
}

const translations: Translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    customers: 'Customers',
    locations: 'Locations',
    employees: 'Employees',
    reports: 'Reports',
    
    // Common actions
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    back: 'Back',
    search: 'Search',
    viewDetails: 'View Details',
    addNew: 'Add New',
    
    // Dashboard
    activeCustomers: 'Active Customers',
    activeLocations: 'Active Locations',
    openWorkOrders: 'Open Work Orders',
    recentActivity: 'Recent Activity',
    upcomingTasks: 'Upcoming Tasks',
    tasksDueThisWeek: 'Tasks Due This Week',
    
    // Customer related
    addNewCustomer: 'Add New Customer',
    customerInformation: 'Customer Information',
    contactPerson: 'Contact Person',
    contactInformation: 'Contact Information',
    customerSince: 'Customer since',
    noCustomersFound: 'No customers found',
    createNewCustomer: 'Create New Customer',
    companyName: 'Company Name',
    responsibleEmployees: 'Responsible Employees',
    addEmployee: 'Add employee',
    showingCustomers: 'Showing {filtered} of {total} customers',
    allStatuses: 'All Statuses',
    searchCustomers: 'Search customers...',
    
    // Location related
    addNewLocation: 'Add New Location',
    locationDetails: 'Location Details',
    noLocationsFound: 'No locations found',
    searchLocations: 'Search locations, addresses, or customers...',
    createNewLocation: 'Create New Location',
    locationName: 'Location Name',
    description: 'Description',
    startDate: 'Start Date',
    endDate: 'End Date',
    address: 'Address',
    showingLocations: 'Showing {filtered} of {total} locations',
    backToLocations: 'Back to locations',
    locationPhotos: 'Location Photos',
    uploadPhotos: 'Upload Photos',
    locationRequirements: 'Location Requirements',
    addRequirement: 'Add Requirement',
    
    // Comments & Activity
    addComment: 'Add Comment',
    writeComment: 'Add a note or comment...',
    noComments: 'No comments yet. Be the first to add one!',
    activityAndComments: 'Activity & Comments',
    
    // Profile
    profile: 'Profile',
    settings: 'Settings',
    signOut: 'Sign out',
    language: 'Language',
    english: 'English',
    danish: 'Danish',
    
    // Support
    needHelp: 'Need help?',
    contactSupport: 'Contact support',
    
    // Status
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    planned: 'Planned',
    inProgress: 'In Progress',
    completed: 'Completed',
    
    // Form fields
    email: 'Email',
    phone: 'Phone',
    notes: 'Notes',
    
    // Validation & Errors
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    tryAgain: 'Please try again',
    clearFilters: 'Clear filters',
    adjustSearch: 'Try adjusting your search or filter criteria to find what you\'re looking for.',
  },
  da: {
    // Navigation
    dashboard: 'Dashboard',
    customers: 'Kunder',
    locations: 'Lokationer',
    employees: 'Medarbejdere',
    reports: 'Rapporter',
    
    // Common actions
    create: 'Opret',
    edit: 'Rediger',
    delete: 'Slet',
    cancel: 'Annuller',
    save: 'Gem',
    back: 'Tilbage',
    search: 'Søg',
    viewDetails: 'Se Detaljer',
    addNew: 'Tilføj Ny',
    
    // Dashboard
    activeCustomers: 'Aktive Kunder',
    activeLocations: 'Aktive Lokationer',
    openWorkOrders: 'Åbne Arbejdsordrer',
    recentActivity: 'Seneste Aktivitet',
    upcomingTasks: 'Kommende Opgaver',
    tasksDueThisWeek: 'Opgaver Denne Uge',
    
    // Customer related
    addNewCustomer: 'Tilføj Ny Kunde',
    customerInformation: 'Kundeinformation',
    contactPerson: 'Kontaktperson',
    contactInformation: 'Kontaktinformation',
    customerSince: 'Kunde siden',
    noCustomersFound: 'Ingen kunder fundet',
    createNewCustomer: 'Opret Ny Kunde',
    companyName: 'Firmanavn',
    responsibleEmployees: 'Ansvarlige Medarbejdere',
    addEmployee: 'Tilføj medarbejder',
    showingCustomers: 'Viser {filtered} af {total} kunder',
    allStatuses: 'Alle kunder',
    searchCustomers: 'Søg i kunder...',
    
    // Location related
    addNewLocation: 'Tilføj Ny Lokation',
    locationDetails: 'Lokationsdetaljer',
    noLocationsFound: 'Ingen lokationer fundet',
    searchLocations: 'Søg lokationer, adresser eller kunder...',
    createNewLocation: 'Opret Ny Lokation',
    locationName: 'Lokationsnavn',
    description: 'Beskrivelse',
    startDate: 'Startdato',
    endDate: 'Slutdato',
    address: 'Adresse',
    showingLocations: 'Viser {filtered} af {total} lokationer',
    backToLocations: 'Tilbage til lokationer',
    locationPhotos: 'Lokationsbilleder',
    uploadPhotos: 'Upload Billeder',
    locationRequirements: 'Lokationskrav',
    addRequirement: 'Tilføj Krav',
    
    // Comments & Activity
    addComment: 'Tilføj Kommentar',
    writeComment: 'Tilføj en note eller kommentar...',
    noComments: 'Ingen kommentarer endnu. Vær den første til at tilføje en!',
    activityAndComments: 'Aktivitet & Kommentarer',
    
    // Profile
    profile: 'Profil',
    settings: 'Indstillinger',
    signOut: 'Log ud',
    language: 'Sprog',
    english: 'Engelsk',
    danish: 'Dansk',
    
    // Support
    needHelp: 'Brug for hjælp?',
    contactSupport: 'Kontakt support',
    
    // Status
    status: 'Status',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    planned: 'Planlagt',
    inProgress: 'I Gang',
    completed: 'Afsluttet',
    
    // Form fields
    email: 'E-mail',
    phone: 'Telefon',
    notes: 'Noter',
    
    // Validation & Errors
    required: 'Dette felt er påkrævet',
    invalidEmail: 'Indtast venligst en gyldig e-mailadresse',
    tryAgain: 'Prøv venligst igen',
    clearFilters: 'Ryd filtre',
    adjustSearch: 'Prøv at justere dine søge- eller filterkriterier for at finde det, du leder efter.',
  }
}

export const useLanguageStore = defineStore('language', {
  state: () => ({
    currentLanguage: 'en' as Language
  }),
  
  actions: {
    setLanguage(lang: Language) {
      this.currentLanguage = lang
    },
    
    t(key: string): string {
      return translations[this.currentLanguage][key] || key
    }
  },
  
  persist: true
})
// IndexedDB Database Operations for Flight Risk Assessment Tool

// Database configuration
const DB_NAME = 'FlightRiskDB';
const DB_VERSION = 1;
const HISTORIC_LOG_STORE = 'historicLog';

// Open the database
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        // Handle database upgrade (called when the database is created or version changes)
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create the historic log object store if it doesn't exist
            if (!db.objectStoreNames.contains(HISTORIC_LOG_STORE)) {
                // Create an object store with a timestamp index for sorting
                const store = db.createObjectStore(HISTORIC_LOG_STORE, { keyPath: 'id', autoIncrement: true });
                
                // Create indexes for searching and sorting
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('flightId', 'flightId', { unique: false });
                store.createIndex('date', 'date', { unique: false });
            }
        };
        
        // Handle success
        request.onsuccess = (event) => {
            const db = event.target.result;
            resolve(db);
        };
        
        // Handle errors
        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Add a new entry to the historic log
function addHistoricLogEntry(entry) {
    return new Promise(async (resolve, reject) => {
        try {
            // Generate a unique user ID if not already present in localStorage
            if (!localStorage.getItem('userUniqueId')) {
                localStorage.setItem('userUniqueId', generateUniqueId());
            }
            
            // Add the user ID to the entry
            entry.userUniqueId = localStorage.getItem('userUniqueId');
            
            // Ensure timestamp exists
            if (!entry.timestamp) {
                entry.timestamp = new Date().toISOString();
            }
            
            const db = await openDatabase();
            const transaction = db.transaction([HISTORIC_LOG_STORE], 'readwrite');
            const store = transaction.objectStore(HISTORIC_LOG_STORE);
            
            const request = store.add(entry);
            
            request.onsuccess = () => {
                resolve(request.result); // Returns the generated key
            };
            
            request.onerror = (event) => {
                console.error('Error adding entry:', event.target.error);
                reject(event.target.error);
            };
            
            transaction.oncomplete = () => {
                db.close();
            };
        } catch (error) {
            console.error('Error in addHistoricLogEntry:', error);
            reject(error);
        }
    });
}

// Get all historic log entries for the current user
function getHistoricLogEntries() {
    return new Promise(async (resolve, reject) => {
        try {
            // Get the user's unique ID
            const userUniqueId = localStorage.getItem('userUniqueId');
            
            // If no user ID exists yet, return an empty array
            if (!userUniqueId) {
                resolve([]);
                return;
            }
            
            const db = await openDatabase();
            const transaction = db.transaction([HISTORIC_LOG_STORE], 'readonly');
            const store = transaction.objectStore(HISTORIC_LOG_STORE);
            
            // Get all entries
            const request = store.getAll();
            
            request.onsuccess = () => {
                // Filter entries to only include those belonging to the current user
                const entries = request.result.filter(entry => entry.userUniqueId === userUniqueId);
                resolve(entries);
            };
            
            request.onerror = (event) => {
                console.error('Error getting entries:', event.target.error);
                reject(event.target.error);
            };
            
            transaction.oncomplete = () => {
                db.close();
            };
        } catch (error) {
            console.error('Error in getHistoricLogEntries:', error);
            reject(error);
        }
    });
}

// Delete a historic log entry by ID
function deleteHistoricLogEntry(id) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDatabase();
            const transaction = db.transaction([HISTORIC_LOG_STORE], 'readwrite');
            const store = transaction.objectStore(HISTORIC_LOG_STORE);
            
            // First, get the entry to verify it belongs to the current user
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const entry = getRequest.result;
                const userUniqueId = localStorage.getItem('userUniqueId');
                
                // Only allow deletion if the entry belongs to the current user
                if (entry && entry.userUniqueId === userUniqueId) {
                    const deleteRequest = store.delete(id);
                    
                    deleteRequest.onsuccess = () => {
                        resolve(true);
                    };
                    
                    deleteRequest.onerror = (event) => {
                        console.error('Error deleting entry:', event.target.error);
                        reject(event.target.error);
                    };
                } else {
                    // Entry doesn't exist or doesn't belong to the current user
                    resolve(false);
                }
            };
            
            getRequest.onerror = (event) => {
                console.error('Error getting entry for deletion:', event.target.error);
                reject(event.target.error);
            };
            
            transaction.oncomplete = () => {
                db.close();
            };
        } catch (error) {
            console.error('Error in deleteHistoricLogEntry:', error);
            reject(error);
        }
    });
}

// Generate a unique ID for the user
function generateUniqueId() {
    // Generate a random string that will be unique for each user
    // This is used to ensure users only see their own data
    return 'user_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Export to CSV
function exportHistoricLogToCSV() {
    return new Promise(async (resolve, reject) => {
        try {
            const entries = await getHistoricLogEntries();
            
            if (entries.length === 0) {
                reject('No data to export.');
                return;
            }
            
            // Escape fields that might contain commas, quotes, or newlines
            const escapeCsv = (field) => {
                if (field === null || field === undefined) return '';
                const str = String(field);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };
            
            // Define the order of risk factors based on the main page
            const riskFactorOrder = [
                // Pilot Section
                "Less than 50 Hours in Aircraft or Avionics Type",
                "Less than 15 hours in the last 90 days",
                "Flight will occur after work",
                "Less than 8 hours sleep prior to flight",
                "Dual Instruction Received in last 90 days",
                "WINGS Phase Completion in last 6 months",
                "Instrument Rating current and proficient",
                
                // Flight Conditions Section
                "Twilight or Night",
                "Surface wind greater than 15 Knots",
                "Cross wind greater than 7 Knots",
                "Mountainous Terrain",
                
                // Airport Section
                "Non-towered Airport or tower closed at ETD or ETA",
                "Runway length less than 3,000 Feet",
                "Wet or soft field Runway",
                "Obstacles on Approach and/or departure",
                
                // VFR Flight Plan Section
                "Ceiling less than 3,000 feet AGL",
                "Visibility less than 5 SM",
                "No Weather Reporting at destination",
                "Flight Plan filed and activated",
                "ATC Flight Following used",
                
                // IFR Flight Plan Section
                "Ceiling less than 1000 feet AGL",
                "Visibility less than 3 SM",
                "No Weather Reporting at destination",
                
                // Approaches Section
                "Precision Approach",
                "Non-precision Approach",
                "No Instrument Approach",
                "Circling Approach"
            ];
            
            // Determine all unique risk factors across all entries
            const allRiskFactors = new Set();
            entries.forEach(entry => {
                if (entry.riskFactors && entry.riskFactors.length > 0) {
                    entry.riskFactors.forEach(factor => {
                        // Create a unique identifier for each risk factor
                        if (factor.riskFactor) {
                            allRiskFactors.add(factor.riskFactor);
                        }
                    });
                }
            });
            
            // CSV header - include all possible fields
            let csvContent = 'Date,Flight ID,Departure,Arrival,Flight Plan,Pilot Experience,Risk Score,Pilot Experience Notes,Timestamp';
            
            // Create ordered list of risk factor headers
            const riskFactorHeaders = [];
            
            // First add risk factors in the predefined order
            riskFactorOrder.forEach(factor => {
                if (allRiskFactors.has(factor)) {
                    riskFactorHeaders.push(factor);
                    allRiskFactors.delete(factor);
                }
            });
            
            // Then add any remaining risk factors that weren't in our predefined list
            if (allRiskFactors.size > 0) {
                const remainingFactors = Array.from(allRiskFactors).sort();
                riskFactorHeaders.push(...remainingFactors);
            }
            riskFactorHeaders.forEach(riskFactor => {
                csvContent += `,${escapeCsv(riskFactor)} Value,${escapeCsv(riskFactor)} Notes`;
            });
            
            csvContent += '\n';
            
            // Add each entry to CSV
            entries.forEach(entry => {
                const date = entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A';
                const flightId = entry.flightId || 'N/A';
                const departure = entry.departureAirport || 'N/A';
                const arrival = entry.arrivalAirport || 'N/A';
                const flightPlan = entry.flightplanType || 'N/A';
                const experience = entry.pilotExperience ? `${entry.pilotExperience}` : 'N/A';
                const score = entry.totalScore || '0';
                const pilotNotes = entry.pilotExperienceNotes || '';
                const timestamp = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A';
                
                // Start with the basic fields
                let rowContent = `${escapeCsv(date)},${escapeCsv(flightId)},${escapeCsv(departure)},${escapeCsv(arrival)},${escapeCsv(flightPlan)},${escapeCsv(experience)},${escapeCsv(score)},${escapeCsv(pilotNotes)},${escapeCsv(timestamp)}`;
                
                // Create a map of risk factors for this entry
                const entryRiskFactors = {};
                if (entry.riskFactors && entry.riskFactors.length > 0) {
                    entry.riskFactors.forEach(factor => {
                        if (factor.riskFactor) {
                            entryRiskFactors[factor.riskFactor] = {
                                score: factor.score || '0',
                                notes: factor.notes || ''
                            };
                        }
                    });
                }
                
                // Add each risk factor value and note to the row
                riskFactorHeaders.forEach(riskFactor => {
                    if (entryRiskFactors[riskFactor]) {
                        rowContent += `,${escapeCsv(entryRiskFactors[riskFactor].score)},${escapeCsv(entryRiskFactors[riskFactor].notes)}`;
                    } else {
                        // If this entry doesn't have this risk factor, add empty cells
                        rowContent += `,,`;
                    }
                });
                
                csvContent += rowContent + '\n';
            });
            
            resolve(csvContent);
        } catch (error) {
            console.error('Error in exportHistoricLogToCSV:', error);
            reject(error);
        }
    });
}

// Migrate data from localStorage to IndexedDB (one-time operation)
function migrateFromLocalStorage() {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if migration has already been performed
            if (localStorage.getItem('indexedDBMigrationComplete')) {
                resolve('Migration already completed');
                return;
            }
            
            // Get data from localStorage
            const historicLog = JSON.parse(localStorage.getItem('flightRiskHistoricLog') || '[]');
            
            if (historicLog.length === 0) {
                // No data to migrate
                localStorage.setItem('indexedDBMigrationComplete', 'true');
                resolve('No data to migrate');
                return;
            }
            
            // Add each entry to IndexedDB
            for (const entry of historicLog) {
                await addHistoricLogEntry(entry);
            }
            
            // Mark migration as complete
            localStorage.setItem('indexedDBMigrationComplete', 'true');
            resolve(`Migrated ${historicLog.length} entries from localStorage to IndexedDB`);
        } catch (error) {
            console.error('Error migrating data:', error);
            reject(error);
        }
    });
}

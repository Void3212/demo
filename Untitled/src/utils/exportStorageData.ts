/**
 * Utility to export localStorage data to a JSON file
 * Run this in browser console or import in your app
 */

export function exportAllStorageData() {
  const storageData: Record<string, unknown> = {};
  
  // Get all localStorage items that match our app's keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('chillingan')) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          storageData[key] = JSON.parse(value);
        } catch {
          storageData[key] = value;
        }
      }
    }
  }
  
  // Create and download JSON file
  const dataStr = JSON.stringify(storageData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chillingan-storage-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  
  console.log('Storage data exported:', storageData);
  return storageData;
}

export function importStorageData(data: Record<string, unknown>) {
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });
  console.log('Storage data imported successfully');
}

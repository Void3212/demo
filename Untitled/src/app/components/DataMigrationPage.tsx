import { useState, useEffect } from 'react';
import { migrateReservationsToBackend, migrateProductsToBackend, checkLocalStorageData } from '../../utils/migration';

export default function DataMigrationPage() {
  const [status, setStatus] = useState<'idle' | 'migrating' | 'complete' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [localStorageStatus, setLocalStorageStatus] = useState<{
    hasUsers: boolean;
    hasCurrentUser: boolean;
    hasProducts: boolean;
    hasReservations: boolean;
    reservationCount: number;
  } | null>(null);
  const [migratedReservations, setMigratedReservations] = useState(0);
  const [migratedProducts, setMigratedProducts] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const check = checkLocalStorageData();
    setLocalStorageStatus(check);
  }, []);

  const handleMigration = async () => {
    setStatus('migrating');
    setMessage('Migrating your data...');
    setErrors([]);
    setMigratedReservations(0);
    setMigratedProducts(0);

    const reservationResult = await migrateReservationsToBackend();
    const productResult = await migrateProductsToBackend();

    setMigratedReservations(reservationResult.migratedCount);
    setMigratedProducts(productResult.migratedCount);

    const allErrors = [...reservationResult.errors, ...productResult.errors];

    if (reservationResult.success && productResult.success) {
      setStatus('complete');
      const totalMigrated = reservationResult.migratedCount + productResult.migratedCount;
      setMessage(`✅ Successfully migrated ${totalMigrated} items to the database!`);
    } else {
      setStatus('error');
      setMessage('Migration completed with some errors. See details below.');
      setErrors(allErrors);
    }
  };

  const hasDataToMigrate = localStorageStatus && (localStorageStatus.hasReservations || localStorageStatus.hasProducts);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-6">💾 Data Migration</h1>

          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded">
            <h2 className="font-bold text-blue-900 mb-2">ℹ️ What is this?</h2>
            <p className="text-blue-800">
              This page helps you transfer your existing data (reservations, products, menus) from your browser's local storage to the secure 
              SQLite database server. This ensures your data won't be lost if you clear your browser cache or switch devices.
            </p>
          </div>

          {localStorageStatus && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">📊 Your Current Data</h2>
              <div className="space-y-2">
                <div className={`p-3 rounded ${localStorageStatus.hasCurrentUser ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <span className={localStorageStatus.hasCurrentUser ? 'text-green-800' : 'text-red-800'}>
                    {localStorageStatus.hasCurrentUser ? '✅' : '❌'} Current User Logged In
                  </span>
                </div>
                <div className={`p-3 rounded ${localStorageStatus.hasReservations ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <span className={localStorageStatus.hasReservations ? 'text-green-800' : 'text-gray-800'}>
                    {localStorageStatus.hasReservations ? '✅' : '⚠️'} Reservations Found: <strong>{localStorageStatus.reservationCount}</strong>
                  </span>
                </div>
                <div className={`p-3 rounded ${localStorageStatus.hasProducts ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <span className={localStorageStatus.hasProducts ? 'text-green-800' : 'text-gray-800'}>
                    {localStorageStatus.hasProducts ? '✅' : '⚠️'} Products/Menu Items
                  </span>
                </div>
              </div>
            </div>
          )}

          {hasDataToMigrate && (
            <div className="mb-8">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-bold text-yellow-900 mb-2">⚡ Action Needed</h3>
                <p className="text-yellow-800 mb-4">
                  You have data in your browser's local storage that can be migrated to the SQLite database.
                </p>

                <button
                  onClick={handleMigration}
                  disabled={status === 'migrating'}
                  className={`w-full py-3 px-4 rounded font-bold text-white transition ${
                    status === 'migrating'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                  }`}
                >
                  {status === 'migrating' ? '⏳ Migrating...' : '🚀 Migrate Data Now'}
                </button>
              </div>
            </div>
          )}

          {status === 'complete' && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-bold text-green-900 mb-2">✅ Migration Successful!</h3>
              <p className="text-green-800 mb-2">{message}</p>
              {migratedReservations > 0 && (
                <p className="text-green-800">
                  • <strong>{migratedReservations}</strong> reservation(s) migrated
                </p>
              )}
              {migratedProducts > 0 && (
                <p className="text-green-800">
                  • <strong>{migratedProducts}</strong> product(s) migrated
                </p>
              )}
              <p className="text-green-800 mt-4">
                Your data is now safe and will persist across browser sessions! 🎉
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-bold text-red-900 mb-2">❌ Migration Failed</h3>
              <p className="text-red-800 mb-4">{message}</p>
              {migratedReservations > 0 && (
                <p className="text-red-800">• <strong>{migratedReservations}</strong> reservation(s) migrated</p>
              )}
              {migratedProducts > 0 && (
                <p className="text-red-800">• <strong>{migratedProducts}</strong> product(s) migrated</p>
              )}
              {errors.length > 0 && (
                <div className="bg-red-100 rounded p-3 my-4">
                  <p className="text-sm font-bold text-red-900 mb-2">Errors:</p>
                  <ul className="text-sm text-red-800 space-y-1">
                    {errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={handleMigration}
                className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded font-bold"
              >
                Try Again
              </button>
            </div>
          )}

          {localStorageStatus && !hasDataToMigrate && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-bold text-green-900 mb-2">✅ All Set!</h3>
              <p className="text-green-800">
                You don't have any pending data to migrate. Start making reservations and adding products - 
                they'll be automatically saved to the database!
              </p>
            </div>
          )}

          {localStorageStatus && !localStorageStatus.hasCurrentUser && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-bold text-red-900 mb-2">❌ Please Log In First</h3>
              <p className="text-red-800">
                You need to be logged in to migrate your data. Please log in and return to this page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

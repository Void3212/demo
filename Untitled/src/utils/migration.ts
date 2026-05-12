/**
 * Migration utility to transfer localStorage data to SQLite backend
 * Run this in the browser console or use the migration component
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface LocalStorageData {
  users?: any[];
  currentUser?: any;
  products?: any[];
  reservations?: any[];
  visibleProductIds?: string[];
}

/**
 * Export all localStorage data from Chillingan app
 */
export function exportLocalStorageData(): LocalStorageData {
  const data: LocalStorageData = {};

  // Get all Chillingan-related data from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.includes('chillingan')) continue;

    const value = localStorage.getItem(key);
    if (!value) continue;

    try {
      const parsed = JSON.parse(value);

      if (key.includes('user')) {
        if (key.includes('current')) {
          data.currentUser = parsed;
        } else {
          data.users = parsed;
        }
      } else if (key.includes('product') && !key.includes('visibility')) {
        data.products = parsed;
      } else if (key.includes('reservation') || key.includes('booking')) {
        data.reservations = parsed;
      } else if (key.includes('visibility')) {
        data.visibleProductIds = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.warn(`Failed to parse ${key}:`, e);
    }
  }

  return data;
}

/**
 * Migrate reservations from localStorage to backend database
 */
export async function migrateReservationsToBackend(): Promise<{
  success: boolean;
  message: string;
  migratedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migratedCount = 0;

  try {
    const data = exportLocalStorageData();
    const currentUser = data.currentUser;

    if (!currentUser) {
      return {
        success: false,
        message: 'No user logged in. Please log in first.',
        migratedCount: 0,
        errors: ['No current user found in localStorage']
      };
    }

    // Check if there are reservations to migrate
    if (!data.reservations || !Array.isArray(data.reservations) || data.reservations.length === 0) {
      return {
        success: true,
        message: 'No reservations found to migrate.',
        migratedCount: 0,
        errors: []
      };
    }

    // Migrate each reservation
    for (const reservation of data.reservations) {
      try {
        // Skip if already has an ID that looks like it came from the backend
        if (reservation.id?.startsWith('res_')) {
          migratedCount++;
          continue;
        }

        // Transform the reservation data to match backend format
        const migratedReservation = {
          userId: currentUser.id || 'unknown',
          date: reservation.date || new Date().toISOString().split('T')[0],
          time: reservation.time || '19:00',
          partySize: reservation.partySize || reservation.guests || 4,
          specialRequests: reservation.specialRequests || reservation.notes || undefined,
          status: reservation.status || 'pending'
        };

        // Send to backend
        const response = await fetch(`${API_URL}/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(migratedReservation)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create reservation');
        }

        migratedCount++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Failed to migrate reservation: ${message}`);
        console.error('Migration error for reservation:', reservation, err);
      }
    }

    return {
      success: errors.length === 0,
      message: `Successfully migrated ${migratedCount} reservation(s) to the database!`,
      migratedCount,
      errors
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during migration';
    return {
      success: false,
      message: `Migration failed: ${message}`,
      migratedCount: 0,
      errors: [message]
    };
  }
}

export async function migrateProductsToBackend(): Promise<{
  success: boolean;
  message: string;
  migratedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migratedCount = 0;

  try {
    const data = exportLocalStorageData();

    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
      return {
        success: true,
        message: 'No products found to migrate.',
        migratedCount: 0,
        errors: []
      };
    }

    const visibleIds = Array.isArray(data.visibleProductIds) ? data.visibleProductIds : [];

    for (const product of data.products) {
      try {
        const migratedProduct = {
          id: product.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: product.name || 'Unnamed Product',
          description: product.description || 'No description',
          price: typeof product.price === 'number' ? product.price : Number(product.price) || 0,
          category: product.category || 'Other',
          imageUrl: product.imageUrl || '',
          rating: typeof product.rating === 'number' ? product.rating : Number(product.rating) || 0,
          visible: visibleIds.includes(product.id) || visibleIds.length === 0 ? 1 : 0,
        };

        const response = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(migratedProduct)
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 400 && typeof errorData.error === 'string' && errorData.error.includes('UNIQUE')) {
            const patchResponse = await fetch(`${API_URL}/products/${migratedProduct.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(migratedProduct)
            });
            if (!patchResponse.ok) {
              const patchError = await patchResponse.json();
              throw new Error(patchError.error || 'Failed to update existing product');
            }
          } else {
            throw new Error(errorData.error || 'Failed to create product');
          }
        }

        migratedCount++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Failed to migrate product: ${message}`);
        console.error('Migration error for product:', product, err);
      }
    }

    return {
      success: errors.length === 0,
      message: `Successfully migrated ${migratedCount} product(s) to the database!`,
      migratedCount,
      errors
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during migration';
    return {
      success: false,
      message: `Migration failed: ${message}`,
      migratedCount: 0,
      errors: [message]
    };
  }
}

/**
 * Check what data exists in localStorage
 */
export function checkLocalStorageData(): {
  hasUsers: boolean;
  hasCurrentUser: boolean;
  hasProducts: boolean;
  hasReservations: boolean;
  reservationCount: number;
} {
  const data = exportLocalStorageData();

  return {
    hasUsers: !!data.users && data.users.length > 0,
    hasCurrentUser: !!data.currentUser,
    hasProducts: !!data.products && data.products.length > 0,
    hasReservations: !!data.reservations && data.reservations.length > 0,
    reservationCount: data.reservations?.length || 0
  };
}

/**
 * Run the migration - simple function to call from console
 */
export async function runMigration() {
  console.log('🔄 Starting migration from localStorage to backend...');

  const check = checkLocalStorageData();
  console.log('📊 Current localStorage state:', check);

  if (!check.hasCurrentUser) {
    console.error('❌ No user logged in. Please log in first.');
    return;
  }

  const reservationResult = await migrateReservationsToBackend();
  const productResult = await migrateProductsToBackend();
  
  console.log('✅ Migration complete!');
  console.log('Reservations:', reservationResult);
  console.log('Products:', productResult);

  return {
    reservations: reservationResult,
    products: productResult
  };
}

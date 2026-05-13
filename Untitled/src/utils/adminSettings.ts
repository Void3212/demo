export interface AdminSettings {
  maintenanceMode: boolean;
  allowGuestCheckout: boolean;
  emailNotifications: boolean;
  liveAgentAvailable: boolean;
  liveAgentName: string;
  businessHours: string;
  defaultCurrency: string;
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  maintenanceMode: false,
  allowGuestCheckout: true,
  emailNotifications: true,
  liveAgentAvailable: false,
  liveAgentName: "Lara",
  businessHours: "10:00 - 22:00",
  defaultCurrency: "PHP",
};

export function loadAdminSettings(): AdminSettings {
  if (typeof window === "undefined") {
    return DEFAULT_ADMIN_SETTINGS;
  }

  try {
    const stored = window.localStorage.getItem("admin_settings");
    if (!stored) {
      return DEFAULT_ADMIN_SETTINGS;
    }

    return JSON.parse(stored) as AdminSettings;
  } catch (error) {
    console.error("Failed to load admin settings:", error);
    return DEFAULT_ADMIN_SETTINGS;
  }
}

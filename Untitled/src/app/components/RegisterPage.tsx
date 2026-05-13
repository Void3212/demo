import { useState } from "react";
import { UserAPI } from "../../api/userAPI";

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onNavigateToBrowse?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export default function RegisterPage({ onNavigateToLogin, onNavigateToBrowse, onClose, isModal = false }: RegisterPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<"" | "Weak" | "Medium" | "Strong">("");
  const [error, setError] = useState<string | null>(null);

  const evaluatePasswordStrength = (value: string) => {
    const lengthScore = value.length >= 10;
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    const categories = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

    if (lengthScore && categories === 4) {
      return "Strong" as const;
    }
    if (value.length >= 8 && categories >= 3) {
      return "Medium" as const;
    }
    return value.length > 0 ? "Weak" as const : "" as const;
  };

  const isPhoneValid = (value: string) => /^\d{11}$/.test(value);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProfileImage(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!passwordStrength || passwordStrength !== "Strong") {
      setError("Please choose a strong password before registering.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isPhoneValid(phone)) {
      setError("Phone number must contain exactly 11 digits.");
      return;
    }

    if (!profileImage) {
      setError("Please upload a profile image.");
      return;
    }

    try {
      await UserAPI.registerUser({ name, email, password, phone, address, profileImage });
      onNavigateToLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register.");
    }
  };

  return (
    <div className={isModal ? "relative w-full max-h-[calc(100vh-4rem)] overflow-y-auto p-6 md:p-8" : "min-h-screen bg-[#f1e6d2] px-4 py-10 md:px-8"}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 rounded-[40px] border border-[#f2ddd5] bg-white shadow-[0_40px_120px_rgba(0,0,0,0.08)] md:flex-row md:items-stretch">
        {isModal && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
          >
            ×
          </button>
        ) : null}

        <div className="relative overflow-hidden rounded-[40px] bg-[#ff7a05] p-10 text-white md:w-[45%]">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight">Register</h1>
            <p className="max-w-[360px] text-base leading-8 text-[#fff2e6]">
              Create your Chillingan account and start placing orders with saved address and contact details. New accounts are registered as <span className="font-semibold">customer</span> by default.
            </p>
            <ul className="space-y-3 text-sm text-[#fff7ee]">
              <li>• Saved address for checkout</li>
              <li>• Faster order re-booking</li>
              <li>• Role automatically set to customer</li>
            </ul>
          </div>
          <div className="absolute -right-28 top-10 h-[220px] w-[220px] rounded-full bg-[#fff5ef]/60 blur-[60px]" />
        </div>

        <div className="relative flex flex-1 flex-col justify-center p-10 md:p-16">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.24em] text-[#d51d1d]">Register</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Create your customer account</h2>
            <p className="mt-3 text-sm text-slate-600">Your phone number and address are stored so payments and deliveries can be completed smoothly.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-slate-800">
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-[24px] border border-slate-200 bg-[#fbf7f1] px-4 py-3 text-slate-900 outline-none transition focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ff7a05]/20"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-[24px] border border-slate-200 bg-[#fbf7f1] px-4 py-3 text-slate-900 outline-none transition focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ff7a05]/20"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setPassword(nextValue);
                  setPasswordStrength(evaluatePasswordStrength(nextValue));
                }}
                required
                className="mt-2 w-full rounded-[24px] border border-slate-200 bg-[#fbf7f1] px-4 py-3 text-slate-900 outline-none transition focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ff7a05]/20"
              />
            </label>
            {passwordStrength ? (
              <p className={`text-sm ${passwordStrength === "Strong" ? "text-emerald-600" : passwordStrength === "Medium" ? "text-amber-600" : "text-red-600"}`}>
                Password strength: {passwordStrength}. A strong password needs at least 10 characters, uppercase, lowercase, digits, and a symbol.
              </p>
            ) : null}
            <label className="block text-sm font-semibold text-slate-800">
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-[24px] border border-slate-200 bg-[#fbf7f1] px-4 py-3 text-slate-900 outline-none transition focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ff7a05]/20"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Profile picture
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
                className="mt-2 w-full rounded-[24px] border border-slate-200 bg-[#fbf7f1] px-4 py-3 text-slate-900 outline-none transition file:cursor-pointer file:border-0 file:bg-[#ff7a05] file:px-4 file:py-2 file:text-white file:shadow-none focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ff7a05]/20"
              />
            </label>
            {profileImage && (
              <div className="rounded-[24px] border border-slate-200 bg-[#fbf7f1] p-4">
                <p className="text-sm font-semibold text-slate-700">Profile preview</p>
                <img src={profileImage} alt="Profile preview" className="mt-3 h-24 w-24 rounded-full object-cover shadow-sm" />
              </div>
            )}
            <label className="block text-sm font-semibold text-slate-800">
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-2 w-full rounded-[24px] border border-slate-200 bg-[#fbf7f1] px-4 py-3 text-slate-900 outline-none transition focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ff7a05]/20"
              />
              <p className="mt-2 text-xs text-slate-500">Enter exactly 11 digits for your phone number.</p>
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Delivery address
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="mt-2 w-full rounded-[24px] border border-slate-200 bg-[#fbf7f1] px-4 py-3 text-slate-900 outline-none transition focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ff7a05]/20"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center rounded-[28px] bg-[#ff7a05] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#e26600]"
            >
              Register account
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600 space-y-3">
            <p>
              Already have an account?{' '}
              <button type="button" onClick={onNavigateToLogin} className="font-semibold text-[#ff7a05] hover:underline">
                Log in instead
              </button>
            </p>
            {onNavigateToBrowse ? (
              <p>
                Want to continue browsing?{' '}
                <button type="button" onClick={onNavigateToBrowse} className="font-semibold text-[#ff7a05] hover:underline">
                  Continue as guest
                </button>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
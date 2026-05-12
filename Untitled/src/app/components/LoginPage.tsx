import { useState } from "react";
import { type User, setCurrentUser } from "../data/users";
import { UserAPI } from "../../api/userAPI";

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
}

export default function LoginPage({ onLoginSuccess, onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const user = await UserAPI.loginUser(email, password);
      setCurrentUser(user);
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f1e6d2] px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 rounded-[40px] border border-[#f2ddd5] bg-white shadow-[0_40px_120px_rgba(0,0,0,0.08)] md:flex-row md:items-stretch">
        <div className="relative overflow-hidden rounded-[40px] bg-[#ff7a05] p-10 text-white md:w-[45%]">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight">Chillingan</h1>
            <p className="max-w-[360px] text-base leading-8 text-[#fff2e6]">
              Welcome back. Sign in to continue your order, review your address details, and store your preferences for a faster checkout.
            </p>
            <div className="rounded-[32px] border border-white/20 bg-white/10 p-6 text-sm text-[#fff9f2] shadow-[0_20px_80px_rgba(255,255,255,0.18)]">
              <p className="font-semibold">Admin test account</p>
              <p className="mt-2 text-sm opacity-90">Email: admin@chillingan.com</p>
              <p className="text-sm opacity-90">Password: admin123</p>
            </div>
          </div>
          <div className="absolute -right-28 top-10 h-[220px] w-[220px] rounded-full bg-[#fff5ef]/60 blur-[60px]" />
        </div>

        <div className="flex flex-1 flex-col justify-center p-10 md:p-16">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.24em] text-[#d51d1d]">Log in</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Continue to your account</h2>
            <p className="mt-3 text-sm text-slate-600">Enter your email and password to continue. Registered customers are stored as <span className="font-semibold">customer</span> by default.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
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
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-[24px] border border-slate-200 bg-[#fbf7f1] px-4 py-3 text-slate-900 outline-none transition focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ff7a05]/20"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center rounded-[28px] bg-[#ff7a05] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#e26600]"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600">
            <p>
              New to Chillingan?{' '}
              <button type="button" onClick={onNavigateToRegister} className="font-semibold text-[#ff7a05] hover:underline">
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import OrbitalApp from "./OrbitalApp";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Authenticated>
        <OrbitalApp />
      </Authenticated>
      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
            borderRadius: '14px',
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
}

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white mb-6">
            <span className="text-black font-black text-lg tracking-tighter">O</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Orbital</h1>
          <p className="text-zinc-500 text-sm font-light">Precision practice for BITSAT.</p>
        </div>
        <SignInForm />
        <p className="text-center text-zinc-700 text-xs mt-8 font-light">
          Your progress is saved automatically.
        </p>
      </div>
    </div>
  );
}

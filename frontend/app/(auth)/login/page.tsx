import BrandingPanel from "@/features/auth/components/branding-panel";
import LoginForm from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* Background */}
      <BrandingPanel />

      {/* Login Card */}
      <div className="flex min-h-screen items-center justify-center px-6">

        <LoginForm />

      </div>

    </main>
  );
}
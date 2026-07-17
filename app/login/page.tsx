import { GoogleSignIn } from "./google-sign-in";

export default function LoginPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-fade-in">
          <p className="text-xs uppercase tracking-[0.28em] text-muted mb-6">
            Companion
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-[1.05] text-ink">
            Stay close to the
            <br />
            <span className="italic">people who matter.</span>
          </h1>
          <p className="mt-5 text-ink-soft leading-relaxed text-[15px]">
            A quiet place to remember the people in your life — no streaks, no
            scores, no noise. Just gentle nudges to reach out.
          </p>
        </div>

        <div className="bg-paper border border-line rounded-xl2 p-6 shadow-[0_1px_0_rgba(0,0,0,0.02),0_12px_40px_-24px_rgba(0,0,0,0.25)] animate-fade-in">
          <GoogleSignIn />
          <p className="mt-4 text-center text-xs text-muted leading-relaxed">
            We only use your Google account to sign you in securely.
          </p>
        </div>
      </div>
    </main>
  );
}

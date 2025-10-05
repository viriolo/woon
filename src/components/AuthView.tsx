import React, { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { XCircleIcon, LoadingSpinner, GoogleIcon, FacebookIcon } from "../../components/icons"

interface AuthViewProps {
    onClose: () => void
    prompt?: string
}

const SocialButton: React.FC<{
    provider: "google" | "facebook"
    onClick: () => void
    disabled: boolean
}> = ({ provider, onClick, disabled }) => {
    const isGoogle = provider === "google"
    const styles = isGoogle
        ? "bg-white text-ink-700 border border-ink-200 hover:bg-white/80"
        : "bg-blue-600 text-white border border-transparent hover:bg-blue-700"

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`pill-button w-full justify-center ${styles} disabled:opacity-60`}
        >
            {isGoogle ? <GoogleIcon className="h-5 w-5" /> : <FacebookIcon className="h-5 w-5" />}
            Continue with {isGoogle ? "Google" : "Facebook"}
        </button>
    )
}

export default function AuthView({ onClose, prompt }: AuthViewProps) {
    const { signUp, logIn, socialLogIn } = useAuth()
    const [mode, setMode] = useState<"login" | "signup">("login")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSocialLogin = async (provider: "google" | "facebook") => {
        setError("")
        setIsLoading(true)
        try {
            await socialLogIn(provider)
            // For OAuth, user will be redirected - don't close modal here
            // The auth state change will handle the modal closure
        } catch (err: any) {
            setError(err.message || "An error occurred during social login.")
            setIsLoading(false)
        }
        // Don't set loading to false here - user is being redirected
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError("")

        // Client-side validation
        if (mode === "signup" && !name.trim()) {
            setError("Please enter your name.")
            return
        }

        if (!email.trim()) {
            setError("Please enter your email address.")
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address.")
            return
        }

        if (!password) {
            setError("Please enter your password.")
            return
        }

        if (mode === "signup" && password.length < 6) {
            setError("Password must be at least 6 characters long.")
            return
        }

        setIsLoading(true)

        try {
            if (mode === "signup") {
                await signUp(name.trim(), email.trim(), password)
            } else {
                await logIn(email.trim(), password)
            }
            onClose()
        } catch (err: any) {
            setError(err.message || "An error occurred.")
        } finally {
            setIsLoading(false)
        }
    }

    const toggleMode = () => {
        setError("")
        setMode(prev => (prev === "login" ? "signup" : "login"))
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-surface" onClick={event => event.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-ink-400 transition hover:text-ink-600"
                    aria-label="Close authentication"
                >
                    <XCircleIcon className="h-7 w-7" />
                </button>
                <div className="space-y-6">
                    <div className="space-y-2 text-center">
                        {prompt && (
                            <p className="text-sm font-medium text-primary">{prompt}</p>
                        )}
                        <span className="section-heading text-ink-400">
                            {mode === "login" ? "Welcome back" : "Join Woon"}
                        </span>
                        <h2 className="text-heading text-2xl">
                            {mode === "login" ? "Log in to continue" : "Create an account"}
                        </h2>
                        <p className="text-sm text-ink-500">
                            {mode === "login"
                                ? "Pick up where you left off and keep celebrating."
                                : "Share your celebrations with the neighborhood."}
                        </p>
                    </div>

                    {/* Social login enabled - ensure OAuth providers are configured in Supabase */}
                    {true && (
                        <>
                            <div className="space-y-3">
                                <SocialButton
                                    provider="google"
                                    onClick={() => handleSocialLogin("google")}
                                    disabled={isLoading}
                                />
                                <SocialButton
                                    provider="facebook"
                                    onClick={() => handleSocialLogin("facebook")}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex items-center gap-4 text-xs uppercase text-ink-400">
                                <div className="h-px flex-1 bg-ink-200" />
                                <span>or continue with email</span>
                                <div className="h-px flex-1 bg-ink-200" />
                            </div>
                        </>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {mode === "signup" && (
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                required
                                disabled={isLoading}
                                className="w-full rounded-xl border border-transparent bg-white/85 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                            />
                        )}
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            required
                            disabled={isLoading}
                            className="w-full rounded-xl border border-transparent bg-white/85 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            disabled={isLoading}
                            minLength={6}
                            className="w-full rounded-xl border border-transparent bg-white/85 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                        />

                        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="pill-button pill-accent w-full justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <LoadingSpinner className="h-5 w-5" />
                                    Processing...
                                </>
                            ) : (
                                mode === "login" ? "Log in" : "Sign up"
                            )}
                        </button>
                    </form>

                    <div className="text-center text-sm text-ink-500">
                        <button
                            onClick={toggleMode}
                            className="font-semibold text-primary underline-offset-4 transition hover:underline"
                        >
                            {mode === "login"
                                ? "Don't have an account? Sign up"
                                : "Already have an account? Log in"}
                        </button>
                    </div>

                    {mode === "signup" && (
                        <p className="text-xs text-ink-400 text-center">
                            By signing up, you agree to our Terms of Service and Privacy Policy
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

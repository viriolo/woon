import React, { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { XCircleIcon, LoadingSpinner, GoogleIcon } from "../../components/icons"

interface AuthViewProps {
    onClose: () => void
    prompt?: string
}

const GoogleButton: React.FC<{
    onClick: () => void
    disabled: boolean
}> = ({ onClick, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="pill-button auth-google-button disabled:opacity-60"
    >
        <GoogleIcon className="h-5 w-5" />
        Continue with Google
    </button>
)

export default function AuthView({ onClose, prompt }: AuthViewProps) {
    const { signUp, logIn, socialLogIn } = useAuth()
    const [mode, setMode] = useState<"login" | "signup">("login")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleLogin = async () => {
        setError("")
        setIsLoading(true)
        try {
            await socialLogIn("google")
            // For OAuth, user will be redirected - the auth listener will close the modal
        } catch (err: any) {
            setError(err.message || "An error occurred during social login.")
            setIsLoading(false)
        }
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError("")

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
            <div className="modal-surface auth-modal" onClick={event => event.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="auth-close-button"
                    aria-label="Close authentication"
                >
                    <XCircleIcon className="h-7 w-7" />
                </button>

                <div className="auth-modal__grid">
                    <div className="auth-modal__hero">
                        <div className="auth-modal__hero-content">
                            <span className="auth-modal__badge">Your neighborhood, celebrated</span>
                            <h2>Celebrate every milestone together</h2>
                            <p>
                                Sign in to follow events, share stories, and stay close to what matters around
                                you.
                            </p>
                            <ul className="auth-modal__points">
                                <li>Save gatherings to revisit later</li>
                                <li>Share your own celebrations in seconds</li>
                                <li>Connect with neighbors cheering alongside you</li>
                            </ul>
                        </div>
                    </div>

                    <div className="auth-modal__form">
                        <div className="auth-modal__header">
                            {prompt && <p className="auth-modal__prompt">{prompt}</p>}
                            <span className="section-heading text-ink-400">
                                {mode === "login" ? "Welcome back" : "Join Woon"}
                            </span>
                            <h3>{mode === "login" ? "Log in to continue" : "Create your Woon account"}</h3>
                            <p className="auth-modal__description">
                                {mode === "login"
                                    ? "Pick up where you left off and keep the celebrations going."
                                    : "Add your voice to the neighborhood and start sharing in moments that matter."}
                            </p>
                        </div>

                        <div className="auth-modal__social">
                            <GoogleButton onClick={handleGoogleLogin} disabled={isLoading} />
                            <div className="auth-modal__divider">
                                <span>or use your email</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            {mode === "signup" && (
                                <div className="auth-input-group">
                                    <label htmlFor="auth-name">Full name</label>
                                    <input
                                        id="auth-name"
                                        type="text"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        placeholder="Your name"
                                        required
                                        disabled={isLoading}
                                        className="auth-input"
                                    />
                                </div>
                            )}

                            <div className="auth-input-group">
                                <label htmlFor="auth-email">Email address</label>
                                <input
                                    id="auth-email"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading}
                                    className="auth-input"
                                />
                            </div>

                            <div className="auth-input-group">
                                <label htmlFor="auth-password">Password</label>
                                <input
                                    id="auth-password"
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Minimum 6 characters"
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                    className="auth-input"
                                />
                            </div>

                            {error && <p className="auth-error">{error}</p>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="pill-button pill-accent auth-submit"
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

                        <div className="auth-toggle">
                            <span>
                                {mode === "login"
                                    ? "Don't have an account?"
                                    : "Already have an account?"}
                            </span>
                            <button onClick={toggleMode} type="button">
                                {mode === "login" ? "Sign up" : "Log in"}
                            </button>
                        </div>

                        {mode === "signup" && (
                            <p className="auth-legal">
                                By signing up, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

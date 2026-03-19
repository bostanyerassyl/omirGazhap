import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import useLoginForm from '../model/useLoginForm'

function LoginForm() {
  const { formData, fieldErrors, submitError, handleSubmit, handleFieldChange } =
    useLoginForm()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const location = useLocation()
  const successMessage =
    typeof location.state?.message === 'string' ? location.state.message : null

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true)
    try {
      await handleSubmit(event)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Sign In"
      subtitle="Enter your credentials to access your account"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {successMessage ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {successMessage}
          </div>
        ) : null}
        {submitError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError}
          </div>
        ) : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <User className="h-4 w-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleFieldChange}
                required
                autoComplete="email"
              />
            </InputGroup>
            {fieldErrors.email ? (
              <p className="mt-2 text-sm text-red-300">{fieldErrors.email}</p>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleFieldChange}
                required
                autoComplete="current-password"
              />
              <InputGroupAddon>
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </InputGroupAddon>
            </InputGroup>
            {fieldErrors.password ? (
              <p className="mt-2 text-sm text-red-300">{fieldErrors.password}</p>
            ) : null}
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link
            to="/register"
            className="text-accent hover:underline underline-offset-4 transition-colors"
          >
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default LoginForm

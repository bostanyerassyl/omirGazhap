import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, Users } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import useRegisterForm from '../model/useRegisterForm'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function RegisterForm() {
  const {
    formData,
    fieldErrors,
    submitError,
    submitSuccess,
    handleSubmit,
    handleFieldChange,
  } = useRegisterForm()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
      title="Create Account"
      subtitle="Join the Alatau Smart City community"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {submitError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError}
          </div>
        ) : null}
        {submitSuccess ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {submitSuccess}
          </div>
        ) : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <User className="h-4 w-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleFieldChange}
                required
                autoComplete="name"
              />
            </InputGroup>
            {fieldErrors.fullName ? (
              <p className="mt-2 text-sm text-red-300">{fieldErrors.fullName}</p>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <Mail className="h-4 w-4 text-muted-foreground" />
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
                placeholder="Create a password"
                value={formData.password}
                onChange={handleFieldChange}
                required
                autoComplete="new-password"
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

          <Field>
            <FieldLabel htmlFor="role">Select role</FieldLabel>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  handleFieldChange({
                    target: { name: 'role', value },
                  } as React.ChangeEvent<HTMLSelectElement>)
                }
              >
                <SelectTrigger
                  id="role"
                  className="w-full pl-10 h-10 bg-input border-border"
                >
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="industrialist">Industrialist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {fieldErrors.role ? (
              <p className="mt-2 text-sm text-red-300">{fieldErrors.role}</p>
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
              Creating account...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Create Account
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-accent hover:underline underline-offset-4 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default RegisterForm

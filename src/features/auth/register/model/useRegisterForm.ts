import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/model/AuthProvider'
import { getDefaultRouteForRole } from '@/features/auth/model/auth.routes'
import { registerSchema } from '@/features/auth/model/auth.schema'

export type RegisterRole = 'user' | 'developer' | 'industrialist' | 'utilities'

export type RegisterFormData = {
  fullName: string
  email: string
  password: string
  role: RegisterRole
}

const initialFormData: RegisterFormData = {
  fullName: '',
  email: '',
  password: '',
  role: 'user',
}

function useRegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterFormData, string>>
  >({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = registerSchema.safeParse(formData)

    if (!result.success) {
      const nextErrors = result.error.flatten().fieldErrors

      setFieldErrors({
        fullName: nextErrors.fullName?.[0],
        email: nextErrors.email?.[0],
        password: nextErrors.password?.[0],
        role: nextErrors.role?.[0],
      })

      return null
    }

    setFieldErrors({})
    setSubmitError(null)
    setSubmitSuccess(null)

    const authResult = await register(result.data)

    if (authResult.error) {
      setSubmitError(authResult.error.message)
      return authResult
    }

    if (authResult.data?.session && authResult.data.profile?.role) {
      navigate(getDefaultRouteForRole(authResult.data.profile.role), {
        replace: true,
      })
      return authResult
    }

    setSubmitSuccess('Account created. Continue to sign in.')
    navigate('/login', {
      replace: true,
      state: {
        message: 'Account created. Continue to sign in.',
      },
    })

    return authResult
  }

  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target

    setFieldErrors((current) => ({
      ...current,
      [name]: undefined,
    }))
    setSubmitError(null)

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  return {
    formData,
    fieldErrors,
    submitError,
    submitSuccess,
    handleSubmit,
    handleFieldChange,
  }
}

export default useRegisterForm


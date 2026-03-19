import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/model/AuthProvider'
import { getDefaultRouteForRole } from '@/features/auth/model/auth.routes'
import { loginSchema } from '@/features/auth/model/auth.schema'

export type LoginFormData = {
  email: string
  password: string
}

const initialFormData: LoginFormData = {
  email: '',
  password: '',
}

function useLoginForm() {
  const [formData, setFormData] = useState<LoginFormData>(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = loginSchema.safeParse(formData)

    if (!result.success) {
      const nextErrors = result.error.flatten().fieldErrors

      setFieldErrors({
        email: nextErrors.email?.[0],
        password: nextErrors.password?.[0],
      })

      return null
    }

    setFieldErrors({})
    setSubmitError(null)

    const authResult = await login({
      email: result.data.email,
      password: result.data.password,
    })

    if (authResult.error) {
      setSubmitError(authResult.error.message)
      return authResult
    }

    navigate(getDefaultRouteForRole(authResult.data?.profile?.role ?? null), {
      replace: true,
    })

    return authResult
  }

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
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
    handleSubmit,
    handleFieldChange,
  }
}

export default useLoginForm


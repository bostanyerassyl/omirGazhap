import { useState, type ChangeEvent, type FormEvent } from 'react'
import { signUp } from '../../../../services/api/authService'

export type RegisterRole = 'user' | 'developer' | 'industrialist'

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
    })
  }

  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  return {
    formData,
    handleSubmit,
    handleFieldChange,
  }
}

export default useRegisterForm


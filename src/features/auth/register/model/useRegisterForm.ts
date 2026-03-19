import { useState, type ChangeEvent, type FormEvent } from 'react'

export type RegisterRole = 'user' | 'developer' | 'industrialist'

export type RegisterFormData = {
  username: string
  password: string
  role: RegisterRole
}

const initialFormData: RegisterFormData = {
  username: '',
  password: '',
  role: 'user',
}

function useRegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>(initialFormData)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log(formData)
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

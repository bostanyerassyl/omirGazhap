import { useState, type ChangeEvent, type FormEvent } from 'react'
import { signIn } from '../../../../services/api/authService'

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await signIn({
      email: formData.email,
      password: formData.password,
    })
  }

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
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

export default useLoginForm


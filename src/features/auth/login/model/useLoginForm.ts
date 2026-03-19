import { useState, type ChangeEvent, type FormEvent } from 'react'

export type LoginFormData = {
  username: string
  password: string
}

const initialFormData: LoginFormData = {
  username: '',
  password: '',
}

function useLoginForm() {
  const [formData, setFormData] = useState<LoginFormData>(initialFormData)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log(formData)
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

import { useState, type ChangeEvent, type FormEvent } from 'react'
import styles from './Register.module.css'

type RegisterFormData = {
  username: string
  password: string
  role: 'user' | 'developer'
}

const initialFormData: RegisterFormData = {
  username: '',
  password: '',
  role: 'user',
}

function Register() {
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

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Registration</p>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>
            Register as a user or developer to access the platform.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Username</span>
            <input
              className={styles.input}
              type="text"
              name="username"
              value={formData.username}
              onChange={handleFieldChange}
              placeholder="Enter username"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              className={styles.input}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleFieldChange}
              placeholder="Enter password"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Role</span>
            <select
              className={styles.select}
              name="role"
              value={formData.role}
              onChange={handleFieldChange}
            >
              <option value="user">user</option>
              <option value="developer">developer</option>
            </select>
          </label>

          <button className={styles.submitButton} type="submit">
            Register
          </button>
        </form>

        <p className={styles.loginPrompt}>
          Already registered?{' '}
          <a className={styles.loginLink} href="/login">
            Log in
          </a>
        </p>
      </section>
    </main>
  )
}

export default Register

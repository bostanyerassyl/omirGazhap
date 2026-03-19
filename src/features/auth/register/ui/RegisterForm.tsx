import { Link } from 'react-router-dom'
import useRegisterForm from '../model/useRegisterForm'
import styles from './RegisterForm.module.css'

function RegisterForm() {
  const { formData, handleSubmit, handleFieldChange } = useRegisterForm()

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Registration</p>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>
            Register with your full name, email, and password to access the
            platform.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Full name</span>
            <input
              className={styles.input}
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleFieldChange}
              placeholder="Enter full name"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              className={styles.input}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFieldChange}
              placeholder="Enter email"
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
              <option value="industrialist">industrialist</option>
            </select>
          </label>

          <button className={styles.submitButton} type="submit">
            Register
          </button>
        </form>

        <p className={styles.loginPrompt}>
          Already registered?{' '}
          <Link className={styles.loginLink} to="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterForm

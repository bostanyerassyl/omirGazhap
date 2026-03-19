import { Link } from 'react-router-dom'
import useLoginForm from '../model/useLoginForm'
import styles from './LoginForm.module.css'

function LoginForm() {
  const { formData, handleSubmit, handleFieldChange } = useLoginForm()

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Login</p>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>
            Sign in with your username and password to continue.
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

          <button className={styles.submitButton} type="submit">
            Log in
          </button>
        </form>

        <p className={styles.registerPrompt}>
          Need an account?{' '}
          <Link className={styles.registerLink} to="/register">
            Register
          </Link>
        </p>
      </section>
    </main>
  )
}

export default LoginForm

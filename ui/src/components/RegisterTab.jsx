import { useRef } from 'react'
import useStore from '../store/useStore'

export default function RegisterTab({ onRegister }) {
  const { error, msg, setError } = useStore()
  const usernameRef = useRef()
  const passwordRef = useRef()
  const confirmPasswordRef = useRef()
  const displayNameRef = useRef()
  const emailRef = useRef()

  function handleSubmit(e) {
    e.preventDefault()
    const userName = usernameRef.current.value
    const password = passwordRef.current.value
    const confirmPassword = confirmPasswordRef.current.value
    const displayName = displayNameRef.current.value || userName
    const email = emailRef.current.value
    if (!userName) { setError('Please supply a username'); return }
    if (!password) { setError('Please supply a password'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    onRegister({ userName, password, displayName, email })
  }

  return (
    <div className="tabContent narrow">
      {error && <div className="error">{error}</div>}
      {msg && <div className="msg">{msg}</div>}
      <form onSubmit={handleSubmit}>
        <label>Username: <input type="text" ref={usernameRef} /></label>
        <label>Password: <input type="password" ref={passwordRef} autoComplete="new-password" /></label>
        <label>Confirm Password: <input type="password" ref={confirmPasswordRef} /></label>
        <label>Display Name: <input type="text" ref={displayNameRef} /></label>
        <label>Email: <input type="email" ref={emailRef} /></label>
        <div><button type="submit">Register</button></div>
      </form>
    </div>
  )
}

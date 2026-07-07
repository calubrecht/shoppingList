import { useRef } from 'react'
import useStore from '../store/useStore'

export default function LoginTab({ onLogin, onForgotPassword }) {
  const { error, msg } = useStore()
  const usernameRef = useRef()
  const passwordRef = useRef()

  function handleSubmit(e) {
    e.preventDefault()
    onLogin(usernameRef.current.value, passwordRef.current.value)
  }

  return (
    <div className="tabContent narrow">
      {error && <div className="error">{error}</div>}
      {msg && <div className="msg">{msg}</div>}
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input type="text" ref={usernameRef} autoComplete="username" />
        </label>
        <label>
          Password:
          <input type="password" ref={passwordRef} autoComplete="current-password" />
        </label>
        <div>
          <button type="submit">Login</button>
        </div>
        <span className="forgotLink" onClick={onForgotPassword}>Forgot Password?</span>
      </form>
    </div>
  )
}

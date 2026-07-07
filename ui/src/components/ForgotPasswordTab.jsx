import { useRef } from 'react'
import useStore from '../store/useStore'

export default function ForgotPasswordTab({ onSubmit }) {
  const { error, msg } = useStore()
  const usernameRef = useRef()

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(usernameRef.current.value)
  }

  return (
    <div className="tabContent narrow">
      {error && <div className="error">{error}</div>}
      {msg && <div className="msg">{msg}</div>}
      <p>
        If you've forgotten your password, enter your username. Instructions to reset
        your password will be sent to the email on file.
      </p>
      <form onSubmit={handleSubmit}>
        <label>Username: <input type="text" ref={usernameRef} /></label>
        <div><button type="submit">Reset Password</button></div>
      </form>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import useStore from '../store/useStore'
import { post } from '../api'

export default function ResetPasswordTab({ token, onDone }) {
  const { error, msg, setError, setMsg, clearMessages } = useStore()
  const [status, setStatus] = useState('checking') // checking | invalid | form | success
  const [userName, setUserName] = useState('')
  const passwordRef = useRef()
  const confirmPasswordRef = useRef()

  useEffect(() => {
    clearMessages()
    post({ action: 'checkResetToken', token }).then(data => {
      if (data.valid) {
        setUserName(data.userName)
        setStatus('form')
      } else {
        setError(data.error)
        setStatus('invalid')
      }
    }).catch(() => {
      setError('Unable to validate reset token.')
      setStatus('invalid')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function handleSubmit(e) {
    e.preventDefault()
    const password = passwordRef.current.value
    const confirmPassword = confirmPasswordRef.current.value
    if (!password) { setError('Please supply a password'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    clearMessages()
    post({ action: 'doResetPassword', token, password }).then(data => {
      if (data.success) {
        setStatus('success')
        setMsg('Your password has been reset. You can now log in.')
      } else {
        setError(data.error)
      }
    })
  }

  if (status === 'checking') {
    return <div className="tabContent narrow">Checking reset link&hellip;</div>
  }

  if (status === 'invalid') {
    return (
      <div className="tabContent narrow">
        {error && <div className="error">{error}</div>}
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="tabContent narrow">
        {msg && <div className="msg">{msg}</div>}
        <div><button type="button" onClick={onDone}>Go to Login</button></div>
      </div>
    )
  }

  return (
    <div className="tabContent narrow">
      {error && <div className="error">{error}</div>}
      <p>Resetting password for <strong>{userName}</strong></p>
      <form onSubmit={handleSubmit}>
        <label>Password: <input type="password" ref={passwordRef} autoComplete="new-password" /></label>
        <label>Confirm Password: <input type="password" ref={confirmPasswordRef} /></label>
        <div><button type="submit">Reset Password</button></div>
      </form>
    </div>
  )
}

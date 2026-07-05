function getXsrfToken() {
  const cookie = document.cookie.split('; ').find(r => r.startsWith('XSRF_TOKEN='))
  return cookie ? cookie.split('=')[1] : null
}

export async function post(data) {
  const token = getXsrfToken()
  const res = await fetch('/service/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-XSRF-TOKEN': token } : {}),
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const BASE_URL = 'http://localhost:3001'

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options)

  if (!response.ok) {
    const message = `Request failed: ${response.status} ${response.statusText}`
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

function get(path) {
  return request(path)
}

function post(path, payload) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

function patch(path, payload) {
  return request(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

function del(path) {
  return request(path, { method: 'DELETE' })
}

export { BASE_URL, get, post, patch, del }

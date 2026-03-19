import type { AuthResult } from '@/types/auth'
import { toError } from '@/utils/error'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type HttpRequestConfig = {
  method?: HttpMethod
  path: string
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

function normalizeHeaders(headers?: Record<string, string>) {
  return {
    'Content-Type': 'application/json',
    ...headers,
  }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export const httpClient = {
  async request<T>({
    method = 'GET',
    path,
    body,
    headers,
    signal,
  }: HttpRequestConfig): Promise<AuthResult<T>> {
    try {
      const response = await fetch(path, {
        method,
        headers: normalizeHeaders(headers),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      })

      const data = (await parseResponse(response)) as T

      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : `Request failed with status ${response.status}`

        return {
          data: null,
          error: new Error(message),
        }
      }

      return {
        data,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: toError(error),
      }
    }
  },
}

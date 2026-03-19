export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type HttpRequestConfig = {
  method: HttpMethod
  path: string
  body?: unknown
}

export const httpClient = {
  request(_config: HttpRequestConfig) {
    throw new Error('httpClient is not implemented yet.')
  },
}


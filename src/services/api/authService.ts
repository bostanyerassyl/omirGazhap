import type { RegisterFormData } from '../../features/auth/register/model/useRegisterForm'

export type RegisterPayload = RegisterFormData

export type AuthService = {
  register: (payload: RegisterPayload) => Promise<void>
}

export const authService: AuthService = {
  async register(_payload) {
    throw new Error('authService.register is not implemented yet.')
  },
}

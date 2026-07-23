export interface LoginDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  roleId: string;
}
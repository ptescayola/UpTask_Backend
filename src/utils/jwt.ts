import jwt from 'jsonwebtoken'

type UserPayload = {
  id: any
}

export const generateJWT = (payload: UserPayload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d'
  })
  return token
}

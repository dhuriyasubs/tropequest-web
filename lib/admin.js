const ADMIN_EMAIL = 'dhuriya.subs@gmail.com'

export function isAdmin(user) {
  return !!user && user.email === ADMIN_EMAIL
}

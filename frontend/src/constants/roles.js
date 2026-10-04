export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  COUNSELOR: 'counselor',
  STUDENT: 'student',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  counselor: 'Counselor',
  student: 'Student',
};

export const ROLE_REDIRECTS = {
  super_admin: '/superadmin/dashboard',
  admin: '/admin/dashboard',
  counselor: '/counselor/dashboard',
  student: '/student/dashboard',
};

export const ROLE_COLORS = {
  super_admin: 'bg-slate-100 text-slate-700 border-slate-200',
  admin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  counselor: 'bg-purple-100 text-purple-700 border-purple-200',
  student: 'bg-blue-100 text-blue-700 border-blue-200',
};

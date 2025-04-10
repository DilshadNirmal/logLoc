export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "user",
};

export const mainNavigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER],
  },
  {
    name: "Analytics",
    path: "/analytics",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER],
  },
  {
    name: "Reports",
    path: "/reports",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER],
  },
  {
    name: "Settings",
    path: "/settings",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER],
  },
];

export const profileDropdownItems = {
  [ROLES.SUPER_ADMIN]: [
    { name: "User List", path: "/user-list" },
    { name: "Log List", path: "/log-list" },
    // { name: "Change password", path: "/change-password" },
    { name: "Email Configuration", path: "/email-config" },
  ],
  [ROLES.ADMIN]: [
    { name: "User List", path: "/user-list" },
    { name: "Change Password", path: "/change-password" },
    { name: "Email Configuration", path: "/email-config" },
  ],
  [ROLES.USER]: [{ name: "Change Password", path: "/change-password" }],
};

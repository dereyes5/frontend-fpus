export type UserRole = "director" | "operativo" | "social" | "financiero";

export type Permission = {
  canAccessDashboard: boolean;
  canAccessBenefactores: boolean;
  canAccessCartera: boolean;
  canAccessSocial: boolean;
  canAccessReportes: boolean;
  canAccessConfig: boolean;
};

export const getPermissions = (role: UserRole): Permission => {
  const permissions: Record<UserRole, Permission> = {
    director: {
      canAccessDashboard: true,
      canAccessBenefactores: true,
      canAccessCartera: true,
      canAccessSocial: true,
      canAccessReportes: true,
      canAccessConfig: true,
    },
    operativo: {
      canAccessDashboard: true,
      canAccessBenefactores: true,
      canAccessCartera: false,
      canAccessSocial: false,
      canAccessReportes: false,
      canAccessConfig: false,
    },
    social: {
      canAccessDashboard: true,
      canAccessBenefactores: false,
      canAccessCartera: false,
      canAccessSocial: true,
      canAccessReportes: false,
      canAccessConfig: false,
    },
    financiero: {
      canAccessDashboard: true,
      canAccessBenefactores: false,
      canAccessCartera: true,
      canAccessSocial: false,
      canAccessReportes: true,
      canAccessConfig: false,
    },
  };

  return permissions[role];
};

export const getUserRole = (): UserRole => {
  return (localStorage.getItem("fpus_user_role") as UserRole) || "director";
};

export const getUserName = (): string => {
  return localStorage.getItem("fpus_user_name") || "Usuario";
};

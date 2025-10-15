import { Calendar, FileText, Home, Settings, Users, LucideIcon } from "lucide-react";

type UserRole = "admin" | "patient" | "dentist" | "dental_staff";

export interface RouteDefinition {
  label: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: UserRole[];
  showInSidebar?: boolean;
  exact?: boolean;
}

const ALL_ROLES: UserRole[] = ["admin", "patient", "dentist", "dental_staff"];

export const ROUTE_DEFINITIONS: RouteDefinition[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: Home,
    allowedRoles: ALL_ROLES,
    showInSidebar: true,
    exact: true,
  },
  {
    label: "Appointments",
    href: "/appointments/patient",
    icon: Calendar,
    allowedRoles: ["patient"],
    showInSidebar: true,
    exact: true,
  },
  {
    label: "Admin Appointments",
    href: "/appointments/admin",
    icon: Calendar,
    allowedRoles: ["dentist", "dental_staff"],
    showInSidebar: true,
    exact: true,
  },
  {
    label: "Patients",
    href: "/patients",
    icon: Users,
    allowedRoles: ["dentist", "dental_staff"],
    showInSidebar: true,
    exact: true,
  },
  {
    label: "Records",
    href: "/records",
    icon: FileText,
    allowedRoles: ["patient"],
    showInSidebar: true,
    exact: true,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    allowedRoles: ALL_ROLES,
    showInSidebar: true,
    exact: false,
  },
];

const normalizePath = (path: string): string => {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.endsWith("/") ? path.slice(0, -1) : path;
};

export const findRouteByPath = (pathname: string): RouteDefinition | undefined => {
  const normalizedPath = normalizePath(pathname);

  return ROUTE_DEFINITIONS.find((route) => {
    const routePath = normalizePath(route.href);
    if (route.exact === false) {
      return normalizedPath === routePath || normalizedPath.startsWith(`${routePath}/`);
    }
    return normalizedPath === routePath;
  });
};

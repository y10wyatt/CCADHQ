export const navigationItems = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Leads", href: "/leads", icon: "leads" },
  { label: "Students", href: "/students", icon: "students" },
  { label: "Marketing", href: "/marketing", icon: "marketing" },
  { label: "Finance", href: "/finance", icon: "finance" },
  { label: "Tasks", href: "/tasks", icon: "tasks" },
  { label: "Team", href: "/team", icon: "team" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;

export type NavigationItem = (typeof navigationItems)[number];

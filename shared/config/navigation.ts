export const navigationItems = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Focus Room", href: "/focus-room", icon: "focus" },
  { label: "Tasks", href: "/tasks", icon: "tasks" },
  { label: "Finance", href: "/finance", icon: "finance" },
] as const;

export type NavigationItem = (typeof navigationItems)[number];

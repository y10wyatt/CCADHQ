export const navigationItems = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Focus Room", href: "/focus-room", icon: "focus" },
  { label: "Tasks", href: "/tasks", icon: "tasks" },
  { label: "Students", href: "/students", icon: "students" },
  { label: "Finance", href: "/finance", icon: "finance" },
  { label: "Marketing", href: "/marketing", icon: "marketing" },
  { label: "Resources", href: "/resources", icon: "resources" },
] as const;

export type NavigationItem = (typeof navigationItems)[number];

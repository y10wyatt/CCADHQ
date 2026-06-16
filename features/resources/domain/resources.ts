import type {
  ResourceCategory,
  ResourceOwner,
} from "@/shared/database/database.types";

export type { ResourceCategory, ResourceOwner };

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  category: ResourceCategory;
  description: string;
  owner: ResourceOwner;
  pinned: boolean;
  createdAt: string;
}

export const resourceCategories: ResourceCategory[] = [
  "Meetings",
  "Students",
  "Marketing",
  "Finance",
  "Teaching",
  "Admin",
  "Tech",
  "Other",
];

export const resourceOwners: ResourceOwner[] = ["William", "Alice", "Team"];

import type { MarketingOwner } from "@/shared/database/database.types";

export type MarketingAccountId = "ccad" | "william" | "alice" | "mascot";

export type MarketingStatus =
  | "Idea Bank"
  | "Selected This Week"
  | "Script Needed"
  | "Ready to Film"
  | "Editing"
  | "Scheduled"
  | "Posted"
  | "Review Performance";

export interface AccountIdentity {
  id: MarketingAccountId;
  name: string;
  purpose: string;
  audience: string;
  content: string[];
  tone: string;
  avoid: string;
  cta: string;
}

export interface ContentLaneRow {
  lane: string;
  roles: Record<MarketingAccountId, string>;
}

export interface ContentIdea {
  id: string;
  title: string;
  account: MarketingAccountId;
  owner: MarketingOwner;
  lane: string;
  audience: string;
  format: string;
  priority: "High" | "Medium" | "Low";
  deadline: string;
  cta: string;
  status: MarketingStatus;
  notes: string;
}

export interface WeeklyScheduleRow {
  day: string;
  posts: Partial<Record<MarketingAccountId, string[]>>;
}

export interface PerformancePost {
  title: string;
  account: MarketingAccountId;
  views: string;
  saves: string;
  comments: string;
  followsGained: string;
  inquiries: string;
  consultationsBooked: string;
  notes: string;
}

export interface WinningTopic {
  topic: string;
  account: MarketingAccountId;
  result: string;
  repeat: string;
}

export interface AssetNeed {
  name: string;
  owner: string;
  status: "Ready" | "Needed" | "Draft";
}

export interface MarketingDashboardData {
  accounts: AccountIdentity[];
  laneRows: ContentLaneRow[];
  workflowStatuses: MarketingStatus[];
  ideas: ContentIdea[];
  weeklySchedule: WeeklyScheduleRow[];
  performancePosts: PerformancePost[];
  winningTopics: WinningTopic[];
  assetNeeds: AssetNeed[];
}

export const accountLabels: Record<MarketingAccountId, string> = {
  ccad: "CCAD",
  william: "William",
  alice: "Alice",
  mascot: "Mascot",
};

export const marketingDashboardData: MarketingDashboardData = {
  accounts: [
    {
      id: "ccad",
      name: "CCAD Official",
      purpose: "Institutional trust",
      audience: "Parents + serious students",
      content: [
        "Portfolio education",
        "Admissions guidance",
        "Student work",
        "Outcomes",
        "Studio philosophy",
      ],
      tone: "Calm, structured, credible",
      avoid: "Too much personality, random vlogs, obvious AI aesthetics",
      cta: "Consultation / trial class",
    },
    {
      id: "william",
      name: "William",
      purpose: "Founder credibility + taste",
      audience: "Parents, students, design peers",
      content: [
        "Design life",
        "RISD",
        "Teaching opinions",
        "Founder process",
        "Plogs",
      ],
      tone: "Reflective, observant, personal",
      avoid: "Too much stress, messy complaints, random posts with no identity value",
      cta: "Trust the mentor / understand CCAD philosophy",
    },
    {
      id: "alice",
      name: "Alice",
      purpose: "Warmth + accessibility",
      audience: "Parents, beginners, current families",
      content: ["Vlogs", "Studio life", "Parent questions", "Student care"],
      tone: "Approachable, familiar, practical",
      avoid: "Becoming a second official CCAD account",
      cta: "Feel comfortable contacting / visiting",
    },
    {
      id: "mascot",
      name: "AI Mascot",
      purpose: "Repeatable education",
      audience: "Students + parents",
      content: [
        "Myths",
        "Definitions",
        "Red flag / green flag",
        "Short explainers",
      ],
      tone: "Simple, light, controlled",
      avoid: "Replacing real teachers or looking too childish",
      cta: "Learn one idea quickly",
    },
  ],
  laneRows: [
    {
      lane: "Portfolio education",
      roles: {
        ccad: "Primary",
        william: "Opinion angle",
        alice: "Parent angle",
        mascot: "Simple explainer",
      },
    },
    {
      lane: "Student work/process",
      roles: {
        ccad: "Primary",
        william: "Commentary",
        alice: "Studio-life angle",
        mascot: "Rare",
      },
    },
    {
      lane: "Admissions timeline",
      roles: {
        ccad: "Primary",
        william: "Personal take",
        alice: "Parent FAQ",
        mascot: "Explainer",
      },
    },
    {
      lane: "Plogs/lifestyle",
      roles: {
        ccad: "No",
        william: "Primary",
        alice: "Primary",
        mascot: "No",
      },
    },
    {
      lane: "Behind-the-scenes",
      roles: {
        ccad: "Secondary",
        william: "Primary",
        alice: "Primary",
        mascot: "No",
      },
    },
    {
      lane: "Testimonials",
      roles: {
        ccad: "Primary",
        william: "Light mention",
        alice: "Warm angle",
        mascot: "No",
      },
    },
    {
      lane: "Awards/outcomes",
      roles: {
        ccad: "Primary",
        william: "Reflection",
        alice: "Parent-friendly",
        mascot: "No",
      },
    },
    {
      lane: "Brand/building CCAD",
      roles: {
        ccad: "Secondary",
        william: "Primary",
        alice: "Light",
        mascot: "No",
      },
    },
  ],
  workflowStatuses: [
    "Idea Bank",
    "Selected This Week",
    "Script Needed",
    "Ready to Film",
    "Editing",
    "Scheduled",
    "Posted",
    "Review Performance",
  ],
  ideas: [
    {
      id: "sample-portfolio-collection",
      title: "作品集不是作品合集",
      account: "ccad",
      owner: "William",
      lane: "Portfolio education",
      audience: "G9-G11 parents",
      format: "Talking-head + student work B-roll",
      cta: "Book portfolio assessment",
      status: "Script Needed",
      priority: "High",
      deadline: "This week",
      notes: "",
    },
    {
      id: "sample-teacher-day",
      title: "一个艺术老师的一天",
      account: "william",
      owner: "William",
      lane: "Plog / founder credibility",
      audience: "Parents + students",
      format: "Plog",
      cta: "Build trust",
      status: "Idea Bank",
      priority: "Medium",
      deadline: "Open",
      notes: "",
    },
    {
      id: "sample-beginner-faq",
      title: "孩子没有基础可以准备作品集吗？",
      account: "alice",
      owner: "Alice",
      lane: "Parent FAQ",
      audience: "Parents of beginner students",
      format: "Talking-head / vlog",
      cta: "Trial class inquiry",
      status: "Selected This Week",
      priority: "High",
      deadline: "Thursday",
      notes: "",
    },
    {
      id: "sample-red-flag",
      title: "Portfolio Red Flag: 只有好看的图",
      account: "mascot",
      owner: "William",
      lane: "Simple explainer",
      audience: "Students + parents",
      format: "Short animated explainer",
      cta: "Save for portfolio planning",
      status: "Idea Bank",
      priority: "Medium",
      deadline: "Open",
      notes: "",
    },
  ],
  weeklySchedule: [
    { day: "Monday", posts: { ccad: ["Portfolio tip"] } },
    {
      day: "Tuesday",
      posts: {
        william: ["Teaching opinion"],
        alice: ["Studio vlog"],
      },
    },
    { day: "Wednesday", posts: { ccad: ["Student process"] } },
    {
      day: "Thursday",
      posts: {
        william: ["Plog / design life"],
        alice: ["Parent FAQ"],
        mascot: ["Short explainer"],
      },
    },
    { day: "Friday", posts: { ccad: ["Admissions FAQ"] } },
    {
      day: "Saturday",
      posts: {
        william: ["Behind-the-scenes"],
        alice: ["Studio vlog"],
      },
    },
    {
      day: "Sunday",
      posts: {
        ccad: ["Review / repost"],
        william: ["Personal reflection"],
      },
    },
  ],
  performancePosts: [
    {
      title: "Portfolio myths carousel",
      account: "ccad",
      views: "2.4k",
      saves: "168",
      comments: "21",
      followsGained: "34",
      inquiries: "7",
      consultationsBooked: "2",
      notes: "Clear title and parent language made the post save-worthy.",
    },
    {
      title: "Studio vlog: beginner critique day",
      account: "alice",
      views: "1.8k",
      saves: "44",
      comments: "39",
      followsGained: "18",
      inquiries: "5",
      consultationsBooked: "1",
      notes: "Warm behind-the-scenes tone lowered the barrier to asking questions.",
    },
  ],
  winningTopics: [
    {
      topic: "Portfolio myths",
      account: "ccad",
      result: "High saves",
      repeat: "Turn into recurring series",
    },
    {
      topic: "Studio vlog",
      account: "alice",
      result: "High comments",
      repeat: "More beginner-friendly posts",
    },
    {
      topic: "RISD reflection",
      account: "william",
      result: "Good follows",
      repeat: "Continue founder credibility lane",
    },
  ],
  assetNeeds: [
    { name: "Student work photos", owner: "CCAD", status: "Needed" },
    { name: "Before/after process images", owner: "CCAD", status: "Needed" },
    { name: "Studio B-roll", owner: "Alice", status: "Draft" },
    { name: "Teacher headshots", owner: "William", status: "Needed" },
    { name: "Alice vlog clips", owner: "Alice", status: "Draft" },
    { name: "Mascot visual template", owner: "William", status: "Needed" },
    { name: "Mascot voice/script format", owner: "William", status: "Draft" },
    { name: "Post cover templates", owner: "CCAD", status: "Needed" },
    { name: "Caption templates", owner: "CCAD", status: "Draft" },
    { name: "CTA snippets", owner: "CCAD", status: "Ready" },
  ],
};

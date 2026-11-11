export type SocialPlatform =
  | "FACEBOOK"
  | "INSTAGRAM"
  | "TIKTOK"
  | "YOUTUBE"
  | "LINKEDIN"
  | "X";

export type PostStatusEnum = "PENDING" | "PROCESSING" | "PUBLISHED" | "FAILED";

export type UserRole = "Admin" | "Client";

export interface AuthUser {
  accessToken?: string;
  id: string;
  role: UserRole;
  userName: string;
  email: string | null;
  phone: string;
  address?: string | null;
  profileImage?: string | null;
  status?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  planId?: string | null;
  settings?: {
    n8n_webhook_url?: string;
    automation_secret?: string;
    ai_auto_reply?: boolean;
    ai_confidence?: number;
    [key: string]: unknown;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnifiedMessage {
  id: string;
  workspaceId: string;
  platform: SocialPlatform;
  externalId: string;
  senderId: string;
  text: string | null;
  mediaUrls: string[];
  kind: "message" | "comment";
  timestamp: string;
  status: string;
  aiProcessed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostStatus {
  id: string;
  workspaceId: string;
  jobId: string;
  platform: SocialPlatform;
  content: string;
  status: PostStatusEnum;
  errorLog?: string | null;
  scheduledAt: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupedPost {
  jobId: string;
  content: string;
  createdAt: string;
  platforms: {
    platform: SocialPlatform;
    status: PostStatusEnum;
    publishedAt: string | null;
    errorLog: string | null;
  }[];
}

export interface SocialAccount {
  id: string;
  workspaceId: string;
  platform: SocialPlatform;
  accountName: string;
  kind?: string | null;
  /** Earliest date the platform requires a reconnect (LinkedIn token, Meta 90-day data access). */
  reconnectBy?: string | null;
  connectionStatus: string;
  capabilities: { publishing?: boolean; messaging?: boolean; comments?: boolean };
  tokenExpiry?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  redirectEndpoint?: string | null;
  isRead?: boolean;
  receivedAt?: string;
  createdAt?: string;
}

export interface Plan {
  id: string;
  planType: string;
  amount: number;
  description: string;
  priceId: string;
  productId: string;
  feature: string[];
  active: boolean;
  currency: string;
  interval: string;
}

export interface Subscription {
  id: string;
  planType: string;
  status: string;
  interval: string;
  price?: number | null;
  priceId: string;
  subscriptionId: string;
  createdAt: string;
}

export interface RecentActivity {
  id: string;
  event: string;
  platform: string;
  time: string;
  status: string;
}

export interface DashboardStats {
  totalMessages: number;
  unreadMessages: number;
  pendingAIReplies: number;
  publishedPosts: number;
  failedPosts: number;
  connectedAccounts: number;
  recentActivity: RecentActivity[];
}

export interface Product {
  id: string;
  workspaceId: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  workspaceId: string;
  customer: string;
  total: number;
  status: string;
  items: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIKnowledgeBase {
  id: string;
  workspaceId: string;
  question: string;
  answer: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAnalytics {
  platform: SocialPlatform;
  messages: number;
  published: number;
  failed: number;
  pending: number;
  connectedAccounts: number;
}

export interface WorkspaceAnalytics {
  perPlatform: PlatformAnalytics[];
  totals: {
    messages: number;
    published: number;
    failed: number;
    connectedAccounts: number;
    products: number;
    orders: number;
  };
  byDay: { date: string; messages: number; posts: number }[];
}

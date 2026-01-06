import type {
  User,
  Post,
  Category,
  Team,
  Feedback,
  PostComment,
  PostLike,
  PostCollection,
  FriendRequest,
  Friendship,
  ChatMessage,
  VerificationRequest,
  TeamMember,
} from '@prisma/client';

// ============ Re-export Prisma types ============

export type {
  User,
  Post,
  Category,
  Team,
  Feedback,
  PostComment,
  PostLike,
  PostCollection,
  FriendRequest,
  Friendship,
  ChatMessage,
  VerificationRequest,
  TeamMember,
};

// ============ API 响应类型 ============

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: unknown;
}

export type ApiResult<T> = ApiResponse<T>;

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============ 分页查询参数 ============

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedQuery extends PaginationParams {
  keyword?: string;
  status?: string;
}

// ============ 错误类型 ============

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// ============ 图表数据类型 ============

export interface ChartDataPoint {
  x: string;
  y: number;
}

// ============ Post 相关类型 ============

export interface PostCreateInput {
  title?: string;
  content: string;
  images?: string[];
  tags?: string[];
  categoryId?: string | null;
}

export interface PostResponse {
  id: string;
  title: string | null;
  content: string;
  images: string[];
  tags: string[];
  authorId: string;
  categoryId: string | null;
  viewCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    name: string | null;
    image: string | null;
    school: string | null;
    role: string;
  };
  isLiked?: boolean;
  isCollected?: boolean;
  likeCount?: number;
  commentCount?: number;
}

// ============ Category 相关类型 ============

export interface CategoryResponse {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  usageCount: number;
}

// ============ User 相关类型 ============

export interface UserResponse {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  school: string | null;
  bio: string | null;
  verificationStatus: string;
  status: string;
  createdAt: Date;
}

// ============ 统计相关类型 ============

export interface AdminStats {
  // 用户统计
  userCount: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  newUsers: number;
  weeklyGrowth: number;
  dailyGrowth: number;
  interactionRate: number;

  // 帖子统计
  postCount: number;
  newPosts: number;
  postweeklyGrowth: ChartDataPoint[];

  // 举报统计
  pendingReports: number;
  processedReports: number;
  overallProcessingRate: number;

  // 图表数据
  visitData: ChartDataPoint[];
  salesData: ChartDataPoint[];
  salesTypeData: ChartDataPoint[];
  categoryData?: { name: string; usageCount: number }[];
}

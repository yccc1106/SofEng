import type { PostResponse } from './api';

export interface TeamPerson {
  id: string;
  name: string | null;
  image: string | null;
  school: string | null;
}

export interface TeamSummary {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  type: string | null;
  maxMembers: number;
  creator: TeamPerson;
  _count: { members: number };
}

export interface TeamJoinRequest {
  id: string;
  joinMessage: string | null;
  user: TeamPerson;
  team: { id: string; name: string };
}

export interface CreateTeamValues {
  name: string;
  description?: string;
  image?: string;
  type?: string;
  maxMembers?: number;
}

export interface SearchResults {
  users: Array<{ id: string; name: string | null; image: string | null; bio: string | null; personalityType: string | null }>;
  posts: PostResponse[];
  teams: TeamSummary[];
}

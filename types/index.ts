export type ReviewType = "BACKEND" | "FRONTEND" | "MOBILE"
export type ReviewStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"

export interface ReviewIssue {
  file: string
  line: number
  issue: string
  suggestion: string
}

export interface Repository {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
    avatar_url: string
  }
  private: boolean
}

export interface PullRequest {
  number: number
  title: string
  state: string
  created_at: string
  updated_at: string
  user: {
    login: string
    avatar_url: string
  }
  additions: number
  deletions: number
  changed_files: number
}

export interface Review {
  id: string
  owner: string
  repo: string
  prNumber: number
  prTitle: string
  reviewType: ReviewType
  status: ReviewStatus
  critical?: ReviewIssue[]
  suggestions?: ReviewIssue[]
  bestPractices?: ReviewIssue[]
  labelAdded: boolean
  commentAdded: boolean
  filesChanged?: number
  linesAdded?: number
  linesRemoved?: number
  createdAt: Date
  completedAt?: Date
}

export interface RedditPost {
  data: {
    id: string;
    title: string;
    author: string;
    url: string;
    ups: number;
    num_comments: number;
  };
}

export interface RedditApiResponse {
  data: {
    children: RedditPost[];
  };
}

// New types for post details
export interface RedditPostDetailsData {
  title: string;
  author: string;
  selftext: string;
  ups: number;
  num_comments: number;
  url: string;
}

export interface RedditPostDetails {
  kind: 't3';
  data: RedditPostDetailsData;
}

export interface RedditCommentData {
  author: string;
  body: string;
  ups: number;
  replies: RedditCommentListing | '' | undefined; // Can be an empty string if no replies
  depth: number;
}

export interface RedditComment {
  kind: 't1';
  data: RedditCommentData;
}

export interface RedditCommentListing {
  kind: 'Listing';
  data: {
    children: RedditComment[];
  };
}

// The API returns a tuple as a JSON array
export type RedditPostAndCommentsResponse = [
  { kind: 'Listing'; data: { children: [RedditPostDetails] } },
  RedditCommentListing,
];

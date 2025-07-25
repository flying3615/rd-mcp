# Reddit MCP Server

This plugin provides tools to interact with the Reddit API. It allows AI agents to fetch hot posts from a specified subreddit and retrieve detailed information about a specific post, including its comments.

## Features

- Fetch hot posts from a subreddit.
- Get detailed post information including:
  - Post title and content.
  - Author, upvotes, and number of comments.
  - Post URL.
- Retrieve a tree of comments for a specific post.

## API Tools

### `getRedditHotPosts`

Fetches a list of hot posts from a specified subreddit.

**Parameters:**
- `subreddit`: String - The name of the subreddit (e.g., "typescript", "reactjs").
- `limit`: Number (optional, default: 10) - The number of posts to fetch.

**Response Example:**

```
Top posts in r/typescript:

1. [1loncwp] Who's hiring Typescript developers July
   Author: PUSH_AX, Upvotes: 16, Comments: 5
   URL: https://www.reddit.com/r/typescript/comments/1loncwp/whos_hiring_typescript_developers_july/

2. [1m6r8b8] Announcing ts-regexp: Type-safe RegExp for TypeScript!
   Author: Prize-Procedure6975, Upvotes: 56, Comments: 26
   URL: https://www.reddit.com/r/typescript/comments/1m6r8b8/announcing_tsregexp_typesafe_regexp_for_typescript/
```

### `getRedditPostDetails`

Fetches the detailed content of a specific post, including its comments.

**Parameters:**
- `post_id`: String - The ID of the Reddit post (e.g., "1loncwp").
- `comment_limit`: Number (optional, default: 10) - The number of top-level comments to fetch.
- `comment_depth`: Number (optional, default: 2) - The maximum depth of the comment tree to traverse.

**Response Example:**

```
Title: Who's hiring Typescript developers July
Author: PUSH_AX
Upvotes: 16
Comments: 5
URL: https://www.reddit.com/r/typescript/comments/1loncwp/whos_hiring_typescript_developers_july/

Content:
...

Comments:
[10] some_user: This is a great thread!
  [5] another_user: I agree!
```

### `getRedditNewPosts`

Fetches the newest posts from a specified subreddit.

**Parameters:**
- `subreddit`: String - The name of the subreddit (e.g., "typescript", "reactjs").
- `limit`: Number (optional, default: 10) - The number of posts to fetch.

**Response Example:**

```
Newest posts in r/typescript:

1. [post_id] Post title
   Author: author, Upvotes: 123, Comments: 45
   URL: https://reddit.com/...
```

### `getRedditTopPosts`

Fetches the top posts from a specified subreddit, with an optional time filter.

**Parameters:**
- `subreddit`: String - The name of the subreddit.
- `limit`: Number (optional, default: 10) - The number of posts to fetch.
- `time`: String (optional, default: 'day') - One of 'hour', 'day', 'week', 'month', 'year', 'all'.

**Response Example:**

```
Top posts in r/typescript (time: day):

1. [post_id] Post title
   Author: author, Upvotes: 123, Comments: 45
   URL: https://reddit.com/...
```

### `searchRedditSubreddit`

Searches for posts in a subreddit by query.

**Parameters:**
- `subreddit`: String - The name of the subreddit.
- `query`: String - The search query.
- `limit`: Number (optional, default: 10) - The number of posts to fetch.

**Response Example:**

```
Search results for "typescript" in r/typescript:

1. [post_id] Post title
   Author: author, Upvotes: 123, Comments: 45
   URL: https://reddit.com/...
```

### `getRedditUserInfo`

Fetches information about a Reddit user.

**Parameters:**
- `username`: String - The Reddit username.

**Response Example:**

```
User: u/example
Karma: 12345
Created: 2020-01-01 12:00:00
Is Gold: false
Is Mod: false
Verified: true
Icon: https://...
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This will start the MCP server with `fastmcp` for interactive testing.
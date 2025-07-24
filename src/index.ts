#!/usr/bin/env node

import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { getHotPosts, getPostDetails } from './redditClient.js';
import { RedditComment } from './types.js';

const server = new FastMCP({ name: 'Reddit MCP Server', version: '1.0.0' });

server.addTool({
  name: 'getRedditHotPosts',
  description: 'Get hot posts from a specified subreddit',
  parameters: z.object({
    subreddit: z.string(),
    limit: z.number().optional().default(10),
  }),
  execute: async args => {
    try {
      const postsResponse = await getHotPosts(args.subreddit, args.limit);
      const posts = postsResponse.data.children;
      if (posts.length === 0) {
        return `No hot posts found in r/${args.subreddit}`;
      }
      const formattedPosts = posts
        .map((post, index) => {
          return (
            `${index + 1}. [${post.data.id}] ${post.data.title}\n` +
            `   Author: ${post.data.author}, Upvotes: ${post.data.ups}, Comments: ${post.data.num_comments}\n` +
            `   URL: ${post.data.url}`
          );
        })
        .join('\n\n');
      return `Top posts in r/${args.subreddit}:\n\n${formattedPosts}`;
    } catch (error) {
      console.error('Failed to get and display posts.', error);
      return 'Error fetching posts from Reddit.';
    }
  },
});

function formatComments(comments: RedditComment[], depth = 0): string {
  let result = '';
  for (const comment of comments) {
    if (comment.kind === 't1') {
      result += `${'  '.repeat(depth)}[${comment.data.ups}] ${comment.data.author}: ${comment.data.body.replace(/\n/g, `\n${'  '.repeat(depth)}`)}\n`;
      if (
        typeof comment.data.replies === 'object' &&
        comment.data.replies.data.children.length > 0
      ) {
        result += formatComments(comment.data.replies.data.children, depth + 1);
      }
    }
  }
  return result;
}

server.addTool({
  name: 'getRedditPostDetails',
  description: 'Fetch detailed content of a specific post',
  parameters: z.object({
    post_id: z.string(),
    comment_limit: z.number().optional().default(10),
    comment_depth: z.number().optional().default(2),
  }),
  execute: async args => {
    try {
      const [postDetails, commentListing] = await getPostDetails(
        args.post_id,
        args.comment_limit,
        args.comment_depth
      );
      const post = postDetails.data.children[0].data;
      const comments = commentListing.data.children;
      let result = `Title: ${post.title}\n`;
      result += `Author: ${post.author}\n`;
      result += `Upvotes: ${post.ups}\n`;
      result += `Comments: ${post.num_comments}\n`;
      result += `URL: ${post.url}\n\n`;
      result += `Content:\n${post.selftext}\n\n`;
      result += `Comments:\n`;
      result += formatComments(comments);
      return result;
    } catch (error) {
      console.error('Failed to get post details.', error);
      return 'Error fetching post details from Reddit.';
    }
  },
});

server.start({ transportType: 'stdio' });

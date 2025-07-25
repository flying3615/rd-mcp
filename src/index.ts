#!/usr/bin/env node

import { FastMCP, UserError, imageContent } from 'fastmcp';
import { z } from 'zod';
import {
  getHotPosts,
  getPostDetails,
  getNewPosts,
  getTopPosts,
  searchSubreddit,
  getUserInfo,
} from './redditClient.js';
import { RedditComment } from './types.js';
import axios from 'axios';
import path from 'path';
import https from 'https';

const server = new FastMCP({ name: 'Reddit MCP Server', version: '1.0.0' });

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
  name: 'getRedditHotPosts',
  description: 'Get hot posts from a specified subreddit',
  parameters: z.object({
    subreddit: z.string(),
    limit: z.number().optional().default(30),
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
      throw new UserError('Error fetching posts from Reddit.');
    }
  },
});

server.addTool({
  name: 'getRedditPostDetails',
  description: 'Fetch detailed content of a specific post',
  parameters: z.object({
    post_id: z.string(),
    comment_limit: z.number().optional().default(50),
    comment_depth: z.number().optional().default(3),
    with_image: z.boolean().optional().default(false),
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
      let textResult = `Title: ${post.title}\n`;
      textResult += `Author: ${post.author}\n`;
      textResult += `Upvotes: ${post.ups}\n`;
      textResult += `Comments: ${post.num_comments}\n`;
      textResult += `URL: ${post.url}\n\n`;
      textResult += `Content:\n${post.selftext}\n\n`;
      textResult += `Comments:\n`;
      textResult += formatComments(comments);
      // Check if URL is an image and with_image is true
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const isImage = imageExtensions.some(ext =>
        post.url.toLowerCase().endsWith(ext)
      );
      if (args.with_image && isImage) {
        try {
          const response = await axios.get(post.url, {
            responseType: 'arraybuffer',
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          });
          // Return both text and image
          return {
            content: [
              { type: 'text', text: textResult },
              await imageContent({
                buffer: Buffer.from(response.data),
              }),
            ],
          };
        } catch (imgErr) {
          textResult += `\n[Image fetch failed: ${imgErr}]`;
          return textResult;
        }
      } else {
        return textResult;
      }
    } catch (error) {
      console.error('Failed to get post details.', error);
      throw new UserError('Error fetching post details from Reddit.');
    }
  },
});

server.addTool({
  name: 'getRedditNewPosts',
  description: 'Get the newest posts from a specified subreddit',
  parameters: z.object({
    subreddit: z.string(),
    limit: z.number().optional().default(30),
  }),
  execute: async args => {
    try {
      const postsResponse = await getNewPosts(args.subreddit, args.limit);
      const posts = postsResponse.data.children;
      if (posts.length === 0) {
        return `No new posts found in r/${args.subreddit}`;
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
      return `Newest posts in r/${args.subreddit}:\n\n${formattedPosts}`;
    } catch (error) {
      console.error('Failed to get and display new posts.', error);
      throw new UserError('Error fetching new posts from Reddit.');
    }
  },
});

server.addTool({
  name: 'getRedditTopPosts',
  description:
    'Get top posts from a specified subreddit, with optional time filter',
  parameters: z.object({
    subreddit: z.string(),
    limit: z.number().optional().default(30),
    time: z
      .enum(['hour', 'day', 'week', 'month', 'year', 'all'])
      .optional()
      .default('day'),
  }),
  execute: async args => {
    try {
      const postsResponse = await getTopPosts(
        args.subreddit,
        args.limit,
        args.time
      );
      const posts = postsResponse.data.children;
      if (posts.length === 0) {
        return `No top posts found in r/${args.subreddit}`;
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
      return `Top posts in r/${args.subreddit} (time: ${args.time}):\n\n${formattedPosts}`;
    } catch (error) {
      console.error('Failed to get and display top posts.', error);
      throw new UserError('Error fetching top posts from Reddit.');
    }
  },
});

server.addTool({
  name: 'searchRedditSubreddit',
  description: 'Search for posts in a subreddit by query',
  parameters: z.object({
    subreddit: z.string(),
    query: z.string(),
    limit: z.number().optional().default(30),
    sort: z
      .enum(['relevance', 'hot', 'top', 'new', 'comments'])
      .optional()
      .default('relevance'),
  }),
  execute: async args => {
    try {
      const postsResponse = await searchSubreddit(
        args.subreddit,
        args.query,
        args.limit,
        args.sort
      );
      const posts = postsResponse.data.children;
      if (posts.length === 0) {
        return `No posts found for query "${args.query}" in r/${args.subreddit}`;
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
      return `Search results for "${args.query}" in r/${args.subreddit} (sort: ${args.sort}):\n\n${formattedPosts}`;
    } catch (error) {
      console.error('Failed to search subreddit.', error);
      throw new UserError('Error searching subreddit on Reddit.');
    }
  },
});

server.addTool({
  name: 'getRedditUserInfo',
  description: 'Fetch information about a Reddit user',
  parameters: z.object({
    username: z.string(),
  }),
  execute: async args => {
    try {
      const userInfo = await getUserInfo(args.username);
      const data = userInfo.data;
      if (!data) {
        return `No user info found for u/${args.username}`;
      }
      return (
        `User: u/${data.name}\n` +
        `Karma: ${data.total_karma}\n` +
        `Created: ${new Date(data.created_utc * 1000).toLocaleString()}\n` +
        `Is Gold: ${data.is_gold}\n` +
        `Is Mod: ${data.is_mod}\n` +
        `Verified: ${data.verified}\n` +
        `Icon: ${data.icon_img}`
      );
    } catch (error) {
      console.error('Failed to get user info.', error);
      throw new UserError('Error fetching user info from Reddit.');
    }
  },
});

await server.start({ transportType: 'stdio' });

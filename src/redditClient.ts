import axios from 'axios';
import { RedditApiResponse, RedditPostAndCommentsResponse } from './types.js';

// Disable SSL certificate validation for development purposes
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

export async function getHotPosts(
  subreddit: string,
  limit: number = 10
): Promise<RedditApiResponse> {
  try {
    const response = await axios.get(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching hot posts:', error);
    throw error;
  }
}

export async function getPostDetails(
  postId: string,
  commentLimit: number = 10,
  commentDepth: number = 2
): Promise<RedditPostAndCommentsResponse> {
  try {
    const response = await axios.get(
      `https://www.reddit.com/comments/${postId}.json?limit=${commentLimit}&depth=${commentDepth}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching post details:', error);
    throw error;
  }
}

export async function getNewPosts(
  subreddit: string,
  limit: number = 10
): Promise<RedditApiResponse> {
  try {
    const response = await axios.get(
      `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching new posts:', error);
    throw error;
  }
}

export async function getTopPosts(
  subreddit: string,
  limit: number = 10,
  time: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'day'
): Promise<RedditApiResponse> {
  try {
    const response = await axios.get(
      `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=${time}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching top posts:', error);
    throw error;
  }
}

export async function searchSubreddit(
  subreddit: string,
  query: string,
  limit: number = 10,
  sort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'relevance'
): Promise<RedditApiResponse> {
  try {
    const response = await axios.get(
      `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&restrict_sr=1&sort=${sort}`
    );
    return response.data;
  } catch (error) {
    console.error('Error searching subreddit:', error);
    throw error;
  }
}

export async function getUserInfo(username: string): Promise<any> {
  try {
    const response = await axios.get(
      `https://www.reddit.com/user/${username}/about.json`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}

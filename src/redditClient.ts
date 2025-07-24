import axios from 'axios';
import { RedditApiResponse, RedditPostAndCommentsResponse } from './types.js';

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

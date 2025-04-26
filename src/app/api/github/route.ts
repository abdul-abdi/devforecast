import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Cache is not used in this multi-fetch version
// let etagCache: Record<string, string> = {};

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Function to get multiple trending/popular repositories
 * - Reads 'count' query parameter (default 1, max length of popularRepos)
 * - Fetches specified number of repos concurrently
 * - Returns an array of project data
 */
export async function GET(request: NextRequest) {
  try {
    const apiToken = process.env.GITHUB_API_TOKEN;
    const baseUrl = process.env.NEXT_PUBLIC_GITHUB_API_BASE_URL;

    // Get count from query params, default to 1
    const url = new URL(request.url);
    const countParam = url.searchParams.get('count');
    let count = parseInt(countParam || '1', 10);
    if (isNaN(count) || count < 1) {
      count = 1;
    }

    // Expanded list for more variety
    const popularRepos = [
      'facebook/react', 'vercel/next.js', 'tailwindlabs/tailwindcss', 'shadcn-ui/ui',
      'microsoft/typescript', 'sveltejs/svelte', 'golang/go', 'rust-lang/rust',
      'denoland/deno', 'flutter/flutter', 'vuejs/vue', 'angular/angular',
      'torvalds/linux', 'microsoft/vscode', 'freeCodeCamp/freeCodeCamp',
      'openai/openai-cookbook', 'huggingface/transformers', 'tensorflow/tensorflow',
      'kubernetes/kubernetes', 'docker/compose'
      // Add more repos if desired
    ];

    // Limit count to the number of available repos
    count = Math.min(count, popularRepos.length);

    // Select 'count' unique random repos
    const shuffledRepos = shuffleArray([...popularRepos]);
    const selectedRepos = shuffledRepos.slice(0, count);

    // Set up common headers
    const baseHeaders: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (apiToken && apiToken !== 'your_github_api_token') {
      baseHeaders['Authorization'] = `Bearer ${apiToken}`;
    } else {
        console.log('Using GitHub API without authentication (limited rate)');
    }

    // Fetch data for all selected repos concurrently
    const fetchPromises = selectedRepos.map(async (repoName) => {
      const repoUrl = `${baseUrl}/repos/${repoName}`;
      try {
        const response = await axios.get(repoUrl, {
            headers: baseHeaders,
            // Treat 4xx errors as potential issues but don't throw immediately
            validateStatus: status => status < 500
        });

        // Basic rate limit logging (may be inaccurate for concurrent requests)
        if (response.headers['x-ratelimit-remaining']) {
          const remaining = parseInt(response.headers['x-ratelimit-remaining'], 10);
          const limit = parseInt(response.headers['x-ratelimit-limit'] || '60', 10);
          // Log less frequently to avoid spamming console
          if (Math.random() < 0.1) { // Log ~10% of the time
             console.log(`GitHub API rate limit check: ~${remaining}/${limit} requests remaining`);
          }
        }

        // Handle specific errors for this repo request
        if (response.status === 404) {
           console.warn(`Repo not found: ${repoName}`);
           return null; // Indicate failure for this repo
        }
        if (response.status === 401) {
           console.error(`Auth error fetching ${repoName}`);
           // Potentially throw a more critical error if auth fails entirely?
           return null;
        }
        if (response.status === 403 || response.status === 429) {
           console.warn(`Rate limit or access issue fetching ${repoName}`);
           return null;
        }
        if (response.status >= 400) {
            console.warn(`Error ${response.status} fetching ${repoName}`);
            return null;
        }

        // Extract required data, including id
        const {
          id, // Include the ID
          name,
          full_name,
          description,
          html_url,
          stargazers_count,
          language,
          owner
        } = response.data;

        // Ensure owner and avatar_url exist
        const avatar_url = owner?.avatar_url || '';

        return {
          id,
          name,
          full_name,
          description: description || '', // Ensure description is always a string
          html_url,
          stargazers_count: stargazers_count || 0,
          language: language || '', // Ensure language is always a string
          avatar_url
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during repo fetch';
        console.error(`Failed to fetch data for repo ${repoName}:`, errorMessage);
        return null; // Indicate failure
      }
    });

    // Wait for all fetches to complete
    const results = await Promise.all(fetchPromises);

    // Filter out any null results (failed fetches)
    const successfulProjects = results.filter(project => project !== null);

    // If all requests failed, return an error
    if (successfulProjects.length === 0 && count > 0) {
        return NextResponse.json(
            { error: 'Failed to fetch any GitHub project data', details: 'Could not retrieve data for the selected repositories.' },
            { status: 500 } // Or appropriate error status
        );
    }

    // Return the array of successful projects
    return NextResponse.json(successfulProjects);

  } catch (error: unknown) {
    // Catch broader errors (e.g., issues with URL parsing, setup)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in GitHub route';
    console.error('GitHub API route error:', errorMessage);
    return NextResponse.json(
      {
        error: 'Internal server error fetching GitHub data',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

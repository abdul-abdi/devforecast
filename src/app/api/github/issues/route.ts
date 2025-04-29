import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { GitHubIssue } from '@/types/github';

// Cache for API results to minimize GitHub API calls
const issueCache: Record<string, { data: GitHubIssue[], timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Helper function to get all open issues for a repository
 */
async function getRepositoryIssues(repoFullName: string, headers: Record<string, string>) {
  // Check cache first
  const cacheKey = `issues_${repoFullName}`;
  const now = Date.now();
  if (issueCache[cacheKey] && (now - issueCache[cacheKey].timestamp) < CACHE_DURATION) {
    return issueCache[cacheKey].data;
  }

  const baseUrl = process.env.NEXT_PUBLIC_GITHUB_API_BASE_URL || 'https://api.github.com';
  const issuesUrl = `${baseUrl}/repos/${repoFullName}/issues?state=open&per_page=10`;
  
  try {
    const response = await axios.get(issuesUrl, { headers });
    
    if (response.status !== 200) {
      return [];
    }
    
    const issues = response.data.map((item: { 
      id: number; 
      number: number; 
      title: string; 
      html_url: string; 
      labels: Array<{ name: string; color: string; }>;
      created_at: string;
    }) => ({
      id: item.id,
      number: item.number,
      title: item.title,
      html_url: item.html_url,
      labels: item.labels.map(label => ({
        name: label.name,
        color: label.color
      })),
      created_at: item.created_at
    }));
    
    // Cache the result
    issueCache[cacheKey] = {
      data: issues,
      timestamp: now
    };
    
    return issues;
  } catch (error) {
    console.error(`Error fetching issues for ${repoFullName}:`, error);
    return [];
  }
}

/**
 * API route handler for GitHub repository issues
 */
export async function GET(request: NextRequest) {
  try {
    const apiToken = process.env.GITHUB_API_TOKEN;
    
    // Parse query parameters
    const url = new URL(request.url);
    const repoFullName = url.searchParams.get('repo');
    
    if (!repoFullName) {
      return NextResponse.json(
        { error: 'Missing repository parameter', details: 'Please provide a repository name in the format owner/repo' },
        { status: 400 }
      );
    }
    
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
    
    // Get all open issues
    const issues = await getRepositoryIssues(repoFullName, baseHeaders);
    
    // Return the issues
    return NextResponse.json({ issues });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in GitHub issues route';
    console.error('GitHub issues API route error:', errorMessage);
    
    return NextResponse.json(
      {
        error: 'Internal server error fetching GitHub issues',
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    // Read the request body
    const body = await request.json();
    const { question, repoName } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Missing question', details: 'A question is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_GEMINI_API_BASE_URL;

    if (!apiKey) {
      console.error('Gemini API key is missing');
      return NextResponse.json(
        { error: 'Server configuration error', details: 'AI API key not configured.' },
        { status: 500 }
      );
    }
    if (!baseUrl) {
      console.error('Gemini Base URL is missing');
      return NextResponse.json(
        { error: 'Server configuration error', details: 'AI API URL not configured.' },
        { status: 500 }
      );
    }

    // Building a prompt that guides Gemini to answer questions concisely
    let prompt = '';
    
    if (repoName) {
      // For a specific repository - concise version
      prompt = `I want information about the GitHub repository "${repoName}". 
      My question is: "${question}"
      
      Please provide a brief, direct answer. Be extremely concise and focused on answering only what was asked.
      
      1. Start with a one-sentence answer
      2. If necessary, add 1-2 bullet points with key details
      3. Limit total response to 2-3 sentences maximum
      4. Don't use introductory phrases like "The answer is..."
      
      If you don't have specific information about this repository, just state that briefly and provide a very short general response.`;
    } else {
      // For general repository questions - concise version
      prompt = `I have a question about GitHub repositories: "${question}"
      
      Please provide a brief, direct answer. Be extremely concise and focused on answering only what was asked.
      
      1. Start with a one-sentence answer
      2. If necessary, add 1-2 bullet points with key details  
      3. Limit total response to 2-3 sentences maximum
      4. Don't use introductory phrases like "The answer is..."`;
    }

    console.log("Handling repository question with prompt:", prompt);

    const response = await axios.post(
      `${baseUrl}/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200
        },
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Check for errors in the Gemini response structure
    if (!response.data || !response.data.candidates || response.data.candidates.length === 0 || 
        !response.data.candidates[0].content || !response.data.candidates[0].content.parts || 
        response.data.candidates[0].content.parts.length === 0) {
      console.error('Invalid response structure from Gemini API:', response.data);
      throw new Error('Received an unexpected response format from the AI service.');
    }

    // Extract the generated text from the response
    const generatedText = response.data.candidates[0].content.parts[0].text;
    
    // Post-process to clean up any remaining formatting issues
    const cleanedText = generatedText
      .replace(/\*\*/g, '') // Remove double asterisks
      .replace(/\s\*([^*]+)\*/g, ' $1') // Remove single asterisks used for emphasis
      .trim();

    return NextResponse.json({ 
      message: cleanedText,
      question: question 
    });

  } catch (error) {
    // Error handling
    let errorMessage = 'An unknown error occurred';
    let errorStatus = 500;
    let errorDetails: string | undefined = undefined;

    if (axios.isAxiosError(error)) {
      console.error('Gemini API Axios error details:', error.response?.data || error.message);
      errorMessage = 'Failed to communicate with AI service';
      errorDetails = error.response?.data?.error?.message || error.message;
      errorStatus = error.response?.status || 500;
    } else if (error instanceof Error) {
      console.error('Gemini API general error:', error.message);
      errorMessage = 'Failed to generate AI response';
      errorDetails = error.message;
    } else {
      console.error('Gemini API unknown error:', error);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: errorStatus }
    );
  }
}
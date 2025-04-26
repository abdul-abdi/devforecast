import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    // Read the full body first
    const body = await request.json();
    const { weatherData, projectData, project } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_GEMINI_API_BASE_URL;

    let prompt = '';

    // Mode 1: Specific project insight (from modal)
    if (project && !weatherData && !projectData) {
        if (!project.name || !project.description) {
             return NextResponse.json(
                { error: 'Project name and description are required for project-specific insight' },
                { status: 400 }
            );
        }
      prompt = `Write a short, enthusiastic, and informative summary (1-3 sentences) about the open-source project "${project.name}". Mention its purpose: "${project.description}". Include details like language (${project.language || 'Not specified'}) and star count (${project.stargazers_count || 0}). Focus on encouraging a developer to check it out.`;
    }
    // Mode 2: Global insight (original behavior, requires weather and project)
    else if (weatherData && projectData && !project) {
         if (!weatherData.weather || !weatherData.weather[0] || !projectData.name) {
             return NextResponse.json(
                { error: 'Required weather and project data fields are missing for global insight' },
                { status: 400 }
            );
         }
      prompt = `Given the weather is ${weatherData.weather[0].description} at ${Math.round(weatherData.main.temp)}°C in ${weatherData.name} and a highlighted project is ${projectData.name}: ${projectData.description}, write a short, witty, and encouraging message (1-3 sentences) for a developer seeing this information.`;
    }
    // Mode 3: Global insight (new, requires only weather)
    else if (weatherData && !projectData && !project) {
      if (!weatherData.weather || !weatherData.weather[0] || !weatherData.name) {
        return NextResponse.json(
            { error: 'Required weather data fields are missing for weather-only insight' },
            { status: 400 }
        );
      }
      prompt = `The current weather in ${weatherData.name} is ${weatherData.weather[0].description} with a temperature of ${Math.round(weatherData.main.temp)}°C. Write a short, creative, and encouraging message (1-3 sentences) for a developer, perhaps suggesting an indoor coding activity or enjoying the weather.`;
    }
    // Invalid combination
    else {
      return NextResponse.json(
        { error: 'Invalid request body. Provide {project}, {weatherData, projectData}, or just {weatherData}.' },
        { status: 400 }
      );
    }

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

    console.log("Generating Gemini Insight with prompt:", prompt);

    const response = await axios.post(
      // Ensure the model name is correct (using gemini-1.5-flash as an example, update if needed)
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
          temperature: 0.7,
          maxOutputTokens: 150 // Increased slightly for potentially longer summaries
        },
        // Optional: Add safety settings if needed
        // safetySettings: [
        //   { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        // ],
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Check for errors in the Gemini response structure
    if (!response.data || !response.data.candidates || response.data.candidates.length === 0 || !response.data.candidates[0].content || !response.data.candidates[0].content.parts || response.data.candidates[0].content.parts.length === 0) {
        console.error('Invalid response structure from Gemini API:', response.data);
        throw new Error('Received an unexpected response format from the AI service.');
    }

    // Extract the generated text from the response
    const generatedText = response.data.candidates[0].content.parts[0].text;

    return NextResponse.json({ message: generatedText });

  } catch (error: unknown) {
    // Type guard for axios error
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
        errorMessage = 'Failed to generate AI insight';
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

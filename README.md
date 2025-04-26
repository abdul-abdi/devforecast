# DevForecast

DevForecast is a playful web application that combines daily weather updates, open-source project highlights, and AI-generated insights into a unified experience for tech enthusiasts.

![DevForecast Screenshot](public/screenshot.png)

## Features

- **Real-Time Weather Display**: Get current weather information for any city
- **Open-Source Project Highlight**: Discover interesting GitHub projects
- **AI-Generated Insights**: Enjoy creative, contextually relevant messages that connect the weather and highlighted projects

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/) (leveraging Tailwind CSS and Radix UI primitives)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API Integration**:
  - [OpenWeatherMap API](https://openweathermap.org/api) for weather data
  - [GitHub API](https://docs.github.com/en/rest) for project information
  - [Google Gemini AI API](https://ai.google.dev/) for generating insights

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- API keys for:
  - OpenWeatherMap
  - GitHub (optional, but recommended for higher rate limits)
    - Create a [fine-grained personal access token](https://github.com/settings/tokens?type=beta) with only public repository read access
  - Google Gemini AI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/devforecast.git
   cd devforecast
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your API keys:
   ```
   OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
   GITHUB_API_TOKEN=your_github_api_token
   GEMINI_API_KEY=your_gemini_api_key

   NEXT_PUBLIC_OPENWEATHERMAP_BASE_URL=https://api.openweathermap.org/data/2.5
   NEXT_PUBLIC_GITHUB_API_BASE_URL=https://api.github.com
   NEXT_PUBLIC_GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta
   ```

   > **Note about GitHub API**: The application uses the GitHub REST API v2022-11-28 with best practices including:
   > - Bearer token authentication
   > - Conditional requests with ETags to reduce API usage
   > - Proper rate limit handling
   > - Without a token, you'll be limited to 60 requests per hour

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [OpenWeatherMap](https://openweathermap.org/) for the weather data
- [GitHub](https://github.com/) for the project information
- [Google Gemini AI](https://ai.google.dev/) for the AI-generated insights

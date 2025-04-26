# DevForecast

DevForecast is a playful web application that combines daily weather updates, open-source project highlights, and AI-generated insights into a unified experience for tech enthusiasts.

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
- npm, yarn, or pnpm
- API keys for:
  - OpenWeatherMap (Required)
  - Google Gemini AI (Required)
  - GitHub (Optional, but recommended for higher API rate limits - see `.env.example`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/gitreader.git # Or your repo URL
   cd gitreader
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   # yarn install
   # or
   # pnpm install
   ```

3. Set up your environment variables:
   - Copy the example environment file:
     ```bash
     cp .env.example .env.local
     ```
   - Edit `.env.local` and add your required API keys (OpenWeatherMap and Gemini).
   - Optionally, add your GitHub token for better rate limits.
   - The base URLs for the APIs are usually not needed unless you are using a proxy or specific endpoint.

   ```env
   # .env.local
   OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
   GEMINI_API_KEY=your_gemini_api_key

   # Optional:
   # GITHUB_TOKEN=your_github_token
   # NEXT_PUBLIC_OPENWEATHERMAP_BASE_URL=
   # NEXT_PUBLIC_GITHUB_API_BASE_URL=
   # NEXT_PUBLIC_GEMINI_API_BASE_URL=
   ```

   > **Note about GitHub API**: The application uses the GitHub REST API v2022-11-28 with best practices including bearer token authentication (if provided), conditional requests with ETags, and rate limit handling. Without a token, you'll be limited to 60 requests per hour.

### Running the Development Server

```bash
npm run dev
# or
# yarn dev
# or
# pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
npm run build
```

This command creates an optimized production build of the application.

### Starting the Production Server

After building, you can start the production server:

```bash
npm start
# or
# yarn start
# or
# pnpm start
```

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

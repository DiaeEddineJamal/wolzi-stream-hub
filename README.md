# WolziFlix - Stream Movies, TV Shows & Anime

## Project info

WolziFlix is your premier destination for streaming movies, TV series, and anime. The platform offers a vast library of content that you can enjoy anytime, anywhere.

## Environment Variables

This project requires several environment variables to function properly. Create a `.env` file in the root directory with the following variables:

```
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# TMDB API Configuration
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p

# Jikan API Configuration
VITE_JIKAN_BASE_URL=https://api.jikan.moe/v4

# GogoAnime API Configuration
VITE_GOGOANIME_BASE_URL=https://api.consumet.org/anime/gogoanime
```

You'll need to register at [TMDB](https://www.themoviedb.org/) to get an API key and create a Supabase project for the Supabase credentials.

## How can I edit this code?

There are several ways of editing this application:

**Use your preferred IDE**

To work locally using your own IDE, follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd wolzi-stream-hub

# Step 3: Install the necessary dependencies
npm i

# Step 4: Start the development server with auto-reloading and an instant preview
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s)
- Click the "Edit" button (pencil icon) at the top right of the file view
- Make your changes and commit the changes

**Use GitHub Codespaces**

- Navigate to the main page of your repository
- Click on the "Code" button (green button) near the top right
- Select the "Codespaces" tab
- Click on "New codespace" to launch a new Codespace environment
- Edit files directly within the Codespace and commit and push your changes once you're done

## What technologies are used for this project?

WolziFlix is built with modern web technologies:

- Vite - for fast development and optimized builds
- TypeScript - for type safety and better developer experience
- React - for building the user interface
- shadcn-ui - for beautiful UI components
- Tailwind CSS - for responsive and customizable styling
- Supabase - for backend and authentication
- Framer Motion - for smooth animations

## How to deploy

To deploy WolziFlix, you can use any hosting service that supports static websites like:

- Vercel
- Netlify
- GitHub Pages
- AWS Amplify

For the backend, ensure your Supabase project is properly configured.

## Setting up a custom domain

To use a custom domain:

1. Purchase a domain from a domain registrar (e.g., Namecheap, GoDaddy)
2. Configure DNS settings to point to your hosting provider
3. Set up SSL certificates for secure HTTPS connections
4. Configure your hosting provider to use your custom domain

## Features

- Streaming movies, TV shows, and anime
- User authentication and profiles
- Responsive design for mobile and desktop
- Search functionality
- Content recommendations
- Watchlist and favorites
- Recently watched history

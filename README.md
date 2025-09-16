# stock-project-app
This is a Stock project App


SUPABASE_URL = https://zqynnwqjahohjjfdzumj.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxeW5ud3FqYWhvaGpqZmR6dW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MTcxMTIsImV4cCI6MjA3MzQ5MzExMn0.5fzshkMsQRpLpMu74upg3GgSHzNiY1lX2YZm9ahuCZc




1. Root Directory: `STOCKSPROJECT` is the main project folder containing the backend code

2. Backend Folder: The `backend` directory houses all server-side code

3. Controllers: 
   - Contains business logic for handling requests
   - `rewardController.js` handles stock reward operations
   - `userController.js` manages user-related functions

4. Middleware:
   - `authMiddleware.js` provides authentication/authorization
   - Intercepts requests before reaching controllers
   - Validates user tokens and permissions

5. Routes:
   - Defines API endpoints and URL paths
   - `rewardRoutes.js` handles all reward-related API calls
   - `userRoutes.js` manages user authentication endpoints
   - Maps URLs to specific controller functions

6. Utils Folder:
   - Contains utility files and helpers
   - Includes database connection setup (Supabase client)
   - Houses reusable functions across the application

7. Environment File:
   - `.env` stores sensitive configuration data
   - Contains database URLs, API keys, and secrets
   - Keeps credentials secure and configurable

8. Main Application File:
   - `index.js` is the entry point that starts the server
   - Sets up Express.js framework and middleware
   - Configures route handling and server initialization

9. Package Files:
   - `package.json` lists project dependencies and scripts
   - `package-lock.json` ensures consistent dependency versions
   - Defines how to run and build the application

10. Node Modules:
    - Contains all installed third-party libraries
    - Automatically created when running `npm install`
    - Includes Express.js, Supabase client, and other dependencies

**This structure follows MVC (Model-View-Controller) architecture, separating concerns for better maintainability and scalability.**

# Steps to Run

Welcome! Follow these steps to install and run the frontend dev server.

**Prerequisites:**

- **Ensure you have the correct Node.js version**

  We recommend using the latest LTS (Long-Term Support) version. Check the official Node.js website: https://nodejs.org/
  The minimum supported version is v22.15.0

- **Ensure you have Yarn installed**

  If not, see the instructions on the official website: https://yarnpkg.com/getting-started/install

- **Enable Corepack**

  To ensure that Corepack is enabled, run the following command:

  ```bash
  corepack enable
  ```

  More about corepack you can find here: https://yarnpkg.com/corepack

**Installation Steps:**

1. **Build the Backend Server**

   Navigate to the `deploy` directory and execute the build script. This script will handle cloning necessary repositories and building the backend. It also installs all frontend dependencies and builds it as well.

   *For macOS/Linux:*
   ```bash
   cd deploy
   ./build.sh
   ```

   *For Windows:*
   ```bash
   cd deploy
   ./build.bat
   ```

2. **Navigate to the Directory with Build Artifacts**

   Change your current directory to the `cloudbeaver` folder within the `deploy` directory.

   ```bash
   cd cloudbeaver
   ```

3. **Run the Backend Server**

   Start the backend server by running the execution script.

   *For macOS/Linux:*
   ```bash
   ./run-server.sh
   ```

   *For Windows:*
   ```bash
   ./run-server.bat
   ```

4. **Navigate to the Webapp Directory**

   Open a new terminal window or tab, and change your directory to the web application's product folder.

   ```bash.
   cd webapp/packages/product-default
   ```

5. **Run the Web Application**

   Start the web application development server, specifying the backend server's URL. The default URL is `http://localhost:8978/`.

   *For macOS/Linux:*
   ```bash
   server=http://localhost:8978/ yarn dev
   ```

   *For Windows Command Prompt:*
   ```cmd
   set server=http://localhost:8978/ && yarn dev
   ```

   *For Windows PowerShell:*
   ```powershell
   $env:server="http://localhost:8978/"; yarn dev
   ```

You should see a message with URL of your running dev server like below

> ➜ Local: http://localhost:8080/

# Developing in VSCode

VSCode offers dedicated tasks to streamline development with our project, making it the recommended environment for working on the CloudBeaver Frontend.

To access these tasks, press `F1` (or `Cmd/Ctrl + Shift + P`) in VSCode, select "Tasks: Run Task" from the command palette, and then choose the desired task from the list.

To start the local development server, follow these steps:

1.  Execute the **Build CE** task. This task builds both the backend and frontend.
2.  Run the **Run Backend CE** task to start the backend server.
3.  Run the **Run DevServer CE** task.

These steps will launch the frontend in development mode and proxy API requests to your locally running backend, accessible at `http://localhost:8080/`.

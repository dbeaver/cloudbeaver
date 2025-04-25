# Steps to Run

Welcome! Follow these steps to install and run the frontend dev server.

**Prerequisites:**

- Ensure you have Yarn installed.
  If not, see instruction on official website: https://yarnpkg.com/getting-started/install

- Enable corepack
  To ensure that you have corepack is enabled run the following command

  ```bash
    corepack enable
  ```

  More about corepack you can find here: https://yarnpkg.com/corepack

**Installation Steps:**

1.  **Build the Backend Server:**
    Navigate to the `deploy` directory and execute the build script. This script will handle cloning necessary repositories and building the backend. It also installs all frontend dependencies and builds it as well.

    ```bash
    cd deploy
    ./build.sh
    ```

2.  **Navigate to the Directory with Build Artifacts:**
    Change your current directory to the `cloudbeaver` folder within the `deploy` directory.

    ```bash
    cd cloudbeaver
    ```

3.  **Run the Backend Server:**
    Start the backend server by running the execution script.

    ```bash
    ./run-server.sh
    ```

4.  **Navigate to the Webapp Directory:**
    Open a new terminal window or tab, and change your directory to the web application's product folder.

    ```bash.
    cd webapp/packages/product-default
    ```

5.  **Run the Web Application:**
    Start the web application development server, specifying the backend server's URL. The default URL is `http://localhost:8978/`.

    ```bash
    server=http://localhost:8978/ yarn dev
    ```

You should see a message with URL of your running dev server like below

> ➜ Local: http://localhost:8080/

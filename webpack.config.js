const HtmlWebpackPlugin = require("html-webpack-plugin");
      const { ModuleFederationPlugin } = require("webpack").container;
      const { dependencies } = require("./package.json");
      
      module.exports = {
        entry: "./src/entry",
        mode: "development",
        devServer: {
          port: 4006, // Modificar
          host: "192.168.100.6",
          historyApiFallback: true, // Necesario para que funcione React Router
        },
        module: {
          rules: [
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                  {
                    loader: 'file-loader',
                  },
                ],
              },
            {
              test: /\.(ts|tsx)$/,
              exclude: /node_modules/,
              use: [
                {
                  loader: "babel-loader",
                  options: {
                    presets: [
                      "@babel/preset-env",
                      "@babel/preset-react",
                      "@babel/preset-typescript",
                    ],
                  },
                },
              ],
            },
            {
              test: /\.(js|jsx)$/,
              exclude: /node_modules/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: ["@babel/preset-env", "@babel/preset-react"],
                },
              },
            },
            {
              test: /\.css$/i,
              use: ["style-loader", "css-loader"],
            },
          ],
        },
        plugins: [
          new HtmlWebpackPlugin({
            template: "./public/index.html",
          }),
          new ModuleFederationPlugin({
            name: "mf_food_diary", // Modificar
            filename: "remoteEntry.js",
            exposes: {
              "./FoodDiary": "./src/components/FoodDiary", // Ejemplo, aqui se exponen los componentes
            },
            shared: {
              ...dependencies,
              react: {
                singleton: true,
                requiredVersion: dependencies["react"],
              },
              "react-dom": {
                singleton: true,
                requiredVersion: dependencies["react-dom"],
              },
              'react-router-dom': {
                  singleton: true,
                },
            },
          }),
        ],
        resolve: {
          extensions: [".tsx", ".ts", ".js", ".jsx"],
        },
        target: "web",
      };
      
      // Solo modificar las lineas que tienen comentarios
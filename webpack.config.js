const { Configuration } = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/**
 * @type {Configuration}
 */
const config = {
  entry: {
    index: path.resolve(__dirname, "./src/index.ts"),
  },
  output: {
    path: path.join(__dirname, "./dist"),
    filename: "[name].js",
    publicPath: "/",
  },

  devtool: "source-map",
  mode: "development",
  devServer: {
    host: "0.0.0.0",
    static: {
      directory: path.resolve(__dirname, "dist"),
    },
    port: 8081,
  },
  target: "web",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "svgEditor",
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};

module.exports = config;

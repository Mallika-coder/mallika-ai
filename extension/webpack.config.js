const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    background: "./src/background/service-worker.ts",
    content: "./src/content/content-script.ts",
    sidepanel: "./src/sidepanel/SidePanel.tsx",
    popup: "./src/popup/Popup.tsx",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "[name].css" }),
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "assets", to: "assets" },
        { from: "src/sidepanel/index.html", to: "sidepanel/index.html" },
        { from: "src/popup/index.html", to: "popup/index.html" },
      ],
    }),
  ],
};

const path = require("path");

module.exports = {
  mode: "production",
  entry: ["./src/index.js"],
  output: {
    filename: "eurostatmap.min.js",
    publicPath: "build/",
    library: "eurostatmap",
    libraryTarget: "umd",
    path: path.resolve(__dirname, "build")
  },
  devtool: false,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            cacheDirectory: true,
            sourceMaps: false
          }
        }
      },
    ],
  },
  watch: false,
  optimization: {
    usedExports: true,
    minimize: true,
  },
};

var webpack = require("webpack");
var path = require("path");

module.exports = {
  entry: ["./src/app.js"],
  output: {
    path: path.join(__dirname, 'build/'),
    filename: "app.min.js"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        query: {
          presets: ["es2015"]
        }
      }
    ]
  },
  stats: {
    colors: true
  },
  devtool: "source-map"
};
const { resolve } = require("path")
const PATH = (...p) => resolve(__dirname, ...p)

const APP_COLOR = "#21252b"
const PKG = require("./package.json")
const isProduction = process.env.NODE_ENV === "production"

const BANNER =
`${PKG.name} - ${PKG.description}
 @version ${PKG.version}
 @link ${PKG.homepage}
 @author ${PKG.author}
 @license ${PKG.license}`

const {
  BannerPlugin,
  DefinePlugin,
  LoaderOptionsPlugin,
  ProgressPlugin,
  HotModuleReplacementPlugin,
} = require("webpack")

const HtmlWebpackPlugin = require("html-webpack-plugin")
const WebpackPwaManifest = require("webpack-pwa-manifest")
const CopyWebpackPlugin = require("copy-webpack-plugin")

const PostcssImport = require("postcss-import")
const PostcssAutoprefixer = require("autoprefixer")
const PostcssCSSO = require("postcss-csso")

module.exports = {
	name: PKG.name,

	mode: isProduction ? "production" : "development",
  target: "web",

  context: PATH("./src"),

  entry: {
    [PKG.name]: PATH("./src/index.js"),
  },

  resolve: {
    extensions: [".js", ".json"],
    mainFields: ["browser", "main"],
    symlinks: true,
  },

  output: {
    path: PATH("./dist"),
    filename: `[name]${isProduction ? ".min" : ""}.js`,
  },

  module: {
    rules: [{
      // === HTML ===
      test: /\.html$/i,
      use: [{
        loader: "html-loader",
        options: {
          attrs: [ "link:href" ],
          minimize: true,
          conservativeCollapse: false,
        }
      }]
    },{
      // === Components styles ===
      test: /\.css$/i,
      exclude: [
        PATH("./src/styles"),
      ],
      use: [{
        loader: "raw-loader",
      },{
        loader: "postcss-loader",
        options: {
          ident: "main",
          plugins: [
            // === Any mode plugins ===
            PostcssImport(),
            PostcssAutoprefixer(),
          ].concat(isProduction ? [
            // === Productiont only plugins ===
            PostcssCSSO()
          ] : [
            // === Development only plugins ===
          ])
        }
      }]
    },{
      // === Main page styles ===
      test: /\.css$/i,
      include: [
        PATH("./src/styles"),
      ],
      use: [{
        loader: "file-loader",
        options: {
          name: `[name]${isProduction ? ".min" : ""}.[ext]`,
        }
      },{
        loader: "extract-loader",
      },{
        loader: "css-loader",
        options: {
          importLoaders: 1
        }
      },{
        loader: "postcss-loader",
        options: {
          ident: "main",
          plugins: [
            // === Any mode plugins ===
            PostcssImport(),
            PostcssAutoprefixer(),
          ].concat(isProduction ? [
            // === Productiont mode plugins ===
            PostcssCSSO()
          ] : [
            // === Development mode plugins ===
          ])
        }
      }]
    },{
      // === SVG to String ===
      test: /\.svg$/i,
      use: [{
        loader: "raw-loader",
      }]
    },{

    },{
      // === Extracts source maps ===
      test: /\.js$/,
      enforce: "pre",
      use: [{
        loader: "source-map-loader"
      }]
    }],
  },

  plugins: [
    // === Any mode plugins ===

    new ProgressPlugin(),

    new LoaderOptionsPlugin({
      debug: !isProduction,
      sourceMap: !isProduction,
      minimize: isProduction,
    }),

    new DefinePlugin({
      APP_NAME: JSON.stringify(PKG.name),
      APP_VERSION: JSON.stringify(PKG.version),
      DEBUG: JSON.stringify(!isProduction),
    }),

    new BannerPlugin({
      banner: BANNER
    }),

    new HtmlWebpackPlugin({
      template: PATH("./src/index.html"),
      inject: "head",
    }),

    new WebpackPwaManifest({
      name: PKG.name.split(/[^a-z0-9]+/i).map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(" "),
      description: PKG.description,

      start_url: ".",

      background_color: APP_COLOR,
      theme_color: APP_COLOR,

      display: "fullscreen",
      orientation: "landscape",

      inject: true,
      ios: true,
      fingerprints: false,
      filename: "manifest.json",
    }),

    new CopyWebpackPlugin([{
      from: PATH("./src/mp3"),
      to: "mp3",
    }]),
  ].concat(isProduction ? [
    // === Productiont mode plugins ===
  ] : [
    // === Development mode plugins ===
    new HotModuleReplacementPlugin()
  ]),

  performance: {
    hints: false, // Suppress performance warning
  },

  node: false,
  devtool: isProduction ? false : "source-map",
  stats: "minimal",

  devServer: {
    clientLogLevel: "warning",
    compress: false,
    disableHostCheck: true,
    hot: true,
    progress: true,
    stats: "minimal"
  }
}

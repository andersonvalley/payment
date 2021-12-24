import gulp from 'gulp'
import replace from 'gulp-replace'
import gulpSass from 'gulp-sass'
import dartSass from 'sass'
import versionNumber from 'gulp-version-number'
import browserSync from 'browser-sync'
import autoprefixer from 'gulp-autoprefixer'
import del from 'del'
import groupMedia from 'gulp-group-css-media-queries'
import cleanCss from 'gulp-clean-css'
import rename from 'gulp-rename'
import webp from 'gulp-webp'
import webpack from 'webpack-stream'
import htmlmin from 'gulp-html-minifier'
import webpcss from 'gulp-webpcss'
import gulpif from 'gulp-if'
import panini from 'panini'
import newer from 'gulp-newer'
import notify from 'gulp-notify'
import plumber from 'gulp-plumber'
import svgSprite from 'gulp-svg-sprite'
import image from 'gulp-image'
import uglify from 'gulp-uglify'

const projectFolder = 'build'
const sourceFolder = 'src'

const scss = gulpSass(dartSass)
const { src, dest } = gulp
const isDev = process.env.NODE_ENV === 'development'

const path = {
  build: {
    html: projectFolder + '/',
    css: projectFolder + '/assets/css/',
    js: projectFolder + '/assets/js/',
    img: projectFolder + '/assets/img/',
    fonts: projectFolder + '/assets/fonts/'
  },

  src: {
    html: sourceFolder + '/*.html',
    css: sourceFolder + '/assets/scss/style.scss',
    js: sourceFolder + '/assets/js/*.js',
    img: sourceFolder + '/assets/img/**/*.{jpg,jpeg,png,svg,gif,ico,webp,mp4}',
    fonts: sourceFolder + '/assets/fonts/*.{woff,woff2,ttf,eot}'
  },

  watch: {
    html: sourceFolder + '/**/*.html',
    css: sourceFolder + '/assets/scss/**/*.scss',
    js: sourceFolder + '/assets/js/**/*.js',
    img: sourceFolder + '/assets/img/**/*.{jpg,jpeg,png,svg,gif,ico,webp,mp4}'
  },

  clean: './' + projectFolder + '/'
}

const versionConfig = {
  value: '%MDS%',
  append: {
    key: '_v',
    to: ['css', 'js']
  }
}

export const html = () => {
  panini.refresh()
  return src(path.src.html)
    .pipe(
      panini({
        root: sourceFolder,
        layouts: sourceFolder + '/layouts/',
        partials: sourceFolder + '/partials/',
        helpers: sourceFolder + '/helpers/',
        data: sourceFolder + '/data/'
      })
    )
    .pipe(gulpif(!isDev, versionNumber(versionConfig)))
    .pipe(replace(/@img\//g, 'assets/img/'))
    .pipe(dest(path.build.html))
    .pipe(gulpif(!isDev, htmlmin({ collapseWhitespace: true })))
    .pipe(
      gulpif(
        !isDev,
        rename({
          extname: '.min.html'
        })
      )
    )
    .pipe(gulpif(!isDev, dest(path.build.html)))
    .pipe(gulpif(isDev, browserSync.stream()))
}

const css = () => {
  return src(path.src.css)
    .pipe(plumber(notify.onError('Error: <%= error.message %>')))
    .pipe(replace(/@img\//g, '../img/'))
    .pipe(
      scss({
        outputStyle: 'expanded'
      }).on('error', scss.logError)
    )
    .pipe(groupMedia())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 3 version'],
        grid: true,
        cascade: true
      })
    )
    .pipe(webpcss({ webpClass: '', noWebpClass: '.no-webp' }))
    .pipe(gulpif(!isDev, dest(path.build.css)))
    .pipe(cleanCss())
    .pipe(
      rename({
        extname: '.min.css'
      })
    )
    .pipe(dest(path.build.css))
    .pipe(gulpif(isDev, browserSync.stream()))
}

const js = () => {
  return src(path.src.js)
    .pipe(plumber(notify.onError('Error: <%= error.message %>')))
    .pipe(
      webpack({
        mode: isDev ? 'development' : 'production',
        output: {
          filename: 'main.min.js'
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              type: 'javascript/auto',
              resolve: {
                fullySpecified: false
              },
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    [
                      '@babel/preset-env',
                      {
                        debug: false,
                        corejs: 3,
                        useBuiltIns: 'usage'
                      }
                    ]
                  ]
                }
              }
            }
          ]
        }
      })
    )
    .pipe(dest(path.build.js))
    .pipe(gulpif(isDev, browserSync.stream()))
}

const jsParts = () => {
  return src(sourceFolder + '/assets/js/parts/*.js')
    .pipe(plumber(notify.onError('Error: <%= error.message %>')))
    .pipe(gulpif(!isDev, uglify()))
    .pipe(dest(path.build.js))
    .pipe(gulpif(isDev, browserSync.stream()))
}

const images = () => {
  return src(path.src.img)
    .pipe(plumber(notify.onError('Error: <%= error.message %>')))
    .pipe(newer(path.build.img))
    .pipe(gulpif(!isDev, image()))
    .pipe(dest(path.build.img))
    .pipe(
      webp({
        quality: 90
      })
    )
    .pipe(dest(path.build.img))
    .pipe(gulpif(isDev, browserSync.stream()))
}

const svgSprites = () => {
  return src(sourceFolder + '/assets/img/sprites/*.svg')
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../sprite.svg'
          }
        }
      })
    )
    .pipe(dest(path.build.img))
}

const fonts = () => src(path.src.fonts).pipe(dest(path.build.fonts))

const clean = () => del(path.clean)

const updateBrowser = () => {
  if (isDev) {
    browserSync.init({
      server: {
        baseDir: './' + projectFolder + '/'
      },
      browser: 'google chrome',
      port: 5050,
      notify: false
    })
  }
}

const watchFiles = () => {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([sourceFolder + '/assets/js/parts/*.js'], jsParts)
  gulp.watch([path.watch.img], images)
  gulp.watch([path.watch.img], svgSprites)
}

const dev = gulp.series(clean, html, css, js, jsParts, images, svgSprites, fonts, gulp.parallel(watchFiles, updateBrowser))
const build = gulp.series(clean, html, css, js, jsParts, images, fonts)

export default isDev ? dev : build

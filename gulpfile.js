var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var connect = require('gulp-connect');
var compass = require('gulp-compass');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var clean = require('gulp-clean');
var bowerFiles = require('gulp-bower-files');
var filter = require('gulp-filter');
var size = require('gulp-size');
var flatten = require('gulp-flatten');
var uglify = require('gulp-uglify');
var ngmin = require('gulp-ngmin');
var useref = require('gulp-useref');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var cache = require('gulp-cache');
var imagemin = require('gulp-imagemin')

var dirs = {
  src:   './src/',
  build: './www/',
  tmp:   './.tmp/'
};

var paths = {
  styles: {
    src:  dirs.src   + 'scss/**/*.scss',
    dev:  dirs.tmp   + 'css/',
    dist: dirs.build + 'css/'
  },
  scripts: {
    src:  dirs.src   + 'js/**/*.js',
    dev:  dirs.tmp   + 'js/',
    dist: dirs.build + 'js/'
  }
};

gulp.task('compass-dev', function() {
  return gulp.src('./src/scss/*.scss')
    .pipe(compass({
      css: '.tmp/css',
      sass: './src/scss',
      image: './src/img',
      script: './src/js',
      comments: true,
      require: []
    })).on('error', function(err) {
      console.log(err);
    })
    .pipe(gulp.dest('.tmp/css'))
    .pipe(connect.reload()); // msg livereload
});

gulp.task('compass-dist', function() {
  return gulp.src('./src/scss/*.scss')
    .pipe(compass({
      css: '.tmp/css',
      sass: './src/scss',
      image: './src/img',
      script: './src/js',
      comments: false,
      require: []
    })).on('error', function(err) {
      console.log(err);
    })
    // minification happens in build-html
    .pipe(gulp.dest('.tmp/css'));
});

gulp.task('lint', function () {
  return gulp.src('./src/js/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
    // force lint task to fail if errors
    // .pipe(jshint.reporter('fail'));
});

gulp.task('build-images', function () {
  return gulp.src('src/{images,img}/**/*')
    .pipe(cache(imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest(dirs.build));
    // .pipe($.size());
});

gulp.task('temp-fonts', function () {
  return gulp.src('src/bower_components/**/*')
    .pipe(filter('**/*.{eot,svg,ttf,woff}'))
    .pipe(flatten())
    .pipe(gulp.dest(dirs.tmp + 'fonts'))
    .pipe(size());
});

gulp.task('build-fonts', function () {
  return gulp.src('src/bower_components/**/*', 'src/fonts/**/*')
    .pipe(filter('**/*.{eot,svg,ttf,woff}'))
    .pipe(flatten())
    .pipe(gulp.dest(dirs.build + 'fonts'))
    .pipe(size());
});

gulp.task('temp-scripts', function () {
  return gulp.src('src/js/**/*.js')
    .pipe(ngmin({dynamic: false})) // ng-minify (only own) scripts
    // .pipe(uglify()) // uglify all js in build-html
    .pipe(gulp.dest(paths.scripts.dev));
})

gulp.task('build-html', ['compass-dist', 'temp-scripts'], function () {
  var jsFilter = filter('**/*.js');
  var cssFilter = filter('**/*.css');

  return gulp.src('src/{./index.html,templates/**/*.html}')
    .pipe(useref.assets({searchPath: '{.tmp,src}'}))

    .pipe(jsFilter)
    .pipe(uglify())
    .pipe(jsFilter.restore())

    .pipe(cssFilter)
    .pipe(minifyCss({
      cache: true,
      keepSpecialComments: 0 // 0: remove all
    }))
    .pipe(cssFilter.restore())

    .pipe(rev()) // for rev hash
    .pipe(useref.restore())
    .pipe(useref())
    .pipe(revReplace()) // for rev hash
    .pipe(useref.restore())

    .pipe(gulp.dest(dirs.build))
    .pipe(size());
});

/*** bower ***/

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  // gulp.src('app/styles/*.scss')
  //   .pipe(wiredep({
  //     directory: 'app/bower_components'
  //   }))
  //   .pipe(gulp.dest('app/styles'));

  gulp.src('src/index.html')
    .pipe(wiredep({
      dependencies: true,    // default: true
      devDependencies: true, // default: false,
      directory: 'src/bower_components'
      // exclude: ['bootstrap-sass-official']
    }))
    .pipe(gulp.dest('src'));
});

/*** MAIN TASKS ***/

gulp.task('server', function () {
  connect.server({
    port: 9000,
    livereload: true,
    root: ['.tmp', 'src'] // shares primarily from .tmp
  });
});

gulp.task('serve', ['wiredep', 'compass-dev', 'server', 'temp-fonts', 'watch'])

// Clean build folder
gulp.task('clean', function () {
  return gulp.src('www/*', {read: false})
    .pipe(clean());
});

gulp.task('default', ['serve']);

gulp.task('watch', function() {
  gulp.watch(paths.styles.src, ['compass-dev']);
});

gulp.task('build', ['clean', 'lint'], function () {
  gulp.start('build-fonts');
  gulp.start('build-images');
  gulp.start('build-html');
});
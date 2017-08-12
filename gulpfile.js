var gulp = require('gulp')
var browserify = require('browserify')
var ejs = require('gulp-ejs')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var del = require('del')
var pump = require('pump')
var uglifyify = require('uglifyify')

gulp.task('ejs', function() {
  return gulp.src("./views/index.ejs")
    .pipe(ejs(null, null, {ext: '.html'}))
    .pipe(gulp.dest("./dist"))
})

gulp.task('browserify', function(cb) {
  var b = browserify({
    entries: './src/main.js',
    transform: [uglifyify]
  })

  var b2 = browserify('./src/main.js').transform('uglifyify', {
    global: true,
    ignore: [ '**/node_modules/jsmediatags/**', '**/node_modules/junk/**']
  })
  
  pump([
    b2.bundle(),
    source('app.js'),
    gulp.dest('./dist/js')
  ], cb)
})

gulp.task('static', function () {
  return gulp.src('./public/**').pipe(gulp.dest('./dist'))
})

gulp.task('clean:dist', function () {
  return del([
    'dist/*'
  ])
})

gulp.task('clean:js', function () {
  return del([
    'public/js/app.js'
  ])
})

gulp.task('default', ['clean:dist', 'clean:js', 'ejs', 'static', 'browserify'])

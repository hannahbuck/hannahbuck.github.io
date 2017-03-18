var gulp = require('gulp');
var args = require('yargs').argv;
var browserSync = require('browser-sync');
var config = require('./gulp.config')();
var del = require('del');
var $ = require('gulp-load-plugins')({lazy: true});
var port = process.env.port || config.defaultPort;
var fs = require('fs');

gulp.task('vet', () => {
  log('Analysing source with JSHint and JSCS');

  return gulp
    .src(config.alljs)
    .pipe($.if(args.verbose, $.print()))
    .pipe($.jscs())
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
    .pipe($.jshint.reporter('fail'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('styles', ['clean-styles'], () => {
  log('Compiling sass to css');

  return gulp
    .src(config.sass)
    .pipe($.plumber())
    .pipe($.sass())
    .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
    .pipe(gulp.dest(config.temp))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('clean-styles', () => {
  var files = config.temp + '**/*.css';
  clean(files);
});

gulp.task('browserSync', function() {
  if(browserSync.active) {
    return;
  }

  browserSync.init({
    server: {
      baseDir: ''
    },
    ghostMode: {
        clicks: true,
        forms: true,
        scroll: true
    },
    browser: ['firefox']
  });
});

gulp.task('inject', ['styles'], () => {
  gulp.src('index.html')
    .pipe($.inject(gulp.src(['./css/**/*.css', './js/**/*.js'], {read: false}, {addRootSlash: false})))
    .pipe(gulp.dest(''));
});

gulp.task('watcher', ['browserSync', 'styles', 'inject'], () => {
  gulp.watch([config.sass], ['inject']);
  gulp.watch('*.html', browserSync.reload);
  gulp.watch('./js/**/*.js', ['vet', 'inject']);
});

gulp.task('clean-images', () => {
  clean('dist/images');
});

gulp.task('images', ['clean-images'], () => {
  return gulp.src('./images/*')
    .pipe($.imagemin())
    .pipe($.imageResize({
      width: 2000,
      height: 2000,
      crop : false,
      upscale : false
    }))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('build', ['images'], () => {
  return gulp.src('index.html')
    .pipe($.useref())
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.cssnano()))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('buildImageOverwrites', () => {
  fs.readdir('images/', (err, files) => {
    if (err) { return console.error(err); }

    console.log(files);
    files = moveInArray(files, findVal(files, '_B.'), 4);
    let filtered = files.filter((e, i, a) => {
      for (let b = 0; b < a.length; b++) {
        if (('00' + b).slice(-3) + '.png' === e) {
          return false;
        }
      }
      return true;
    });

    //MOVE item/s within array in direction
    function moveInArray(array, index, size, direction) {
      size = size || 1;
      direction = direction || -1;
      index = index || 1;
      let arr = [].concat(array);
      let add = arr.splice(index, size);
      if (index < 0 || index > array.length - 1) {
        return arr;
      } else if (index + direction < 0) {
        return add.concat(arr);
      } else if (index + direction + (size - 1) > array.length - 1) {
        return arr.concat(add);
      }
      arr = arr.slice(0, index + direction)
            .concat(add)
            .concat(arr.slice(index + direction));
      return arr;
    }

    //splice in items a chosen number of times
    function addToArray(array, index, toAdd, times) {
      let arr = [].concat(array);
      toAdd = toAdd || '';
      times -= 1;
      arr.splice(index + 1, 0, toAdd);
      if (times > 0) { return addToArray(arr, index, toAdd, times); }
      return arr;
    }

    //FIND a search value within an array string
    function findVal(array, value, afterIndex) {
      if (!afterIndex) {
        afterIndex = 0;
      }
      return array.indexOf( array.find((e, i) => {
        return e.includes(value) && i > afterIndex;
      }) );
    }

    filtered = filtered.map((e, i) => {
      return ('00' + (i + (files.length - filtered.length))).slice(-3) + '\': \'' + e;
    });

    //
    // console.log(replace);
    let replace = `var overwrites = {\n  \'${filtered.join('\',\n  \'')}\'\n};`;
    gulp.src('js/script.js')
      .pipe($.replace(/(\/\/OVERWRITES)([\S\s]*)(\/\/ENDOVERWRITES)/i, `$1\n${replace}\n$3`))
      .pipe(gulp.dest('./js/'));

    replace = [];
    files.forEach((e, i, a) => {
      if (e.includes('_B.')) {
        replace.push('      <div class="box extrabig"></div>');
        return;
      }
      if (e.includes('_L.')) {
        replace.push('      <div class="box big"></div>');
        return;
      }
      replace.push('      <div class="box"></div>');
    });

    gulp.src('index.html')
      .pipe($.replace(
        /(<\!\-\-boxes\-\->)([\S\s]*)(<\!\-\-endboxes\-\->)/i,
        `$1\n${replace.join('\n')}\n      $3`
      ))
      .pipe(gulp.dest(''));
  });
});


///////////////

function clean(path) {
  log('Cleaning: ' + $.util.colors.blue(path));
  del(path);
}

function log(msg) {
  if (typeof(msg) === 'object') {
    for (var item in msg) {
      if (msg.hasOw$.nProperty(item)) {
        $.util.log($.util.colors.blue(msg[item]));
      }
    }
  } else {
    $.util.log($.util.colors.blue(msg));
  }
}

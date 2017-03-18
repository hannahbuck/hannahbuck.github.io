module.exports = _ => {
  var temp = './css/';
  var store = './store/';

  var config = {
    //FILES
    alljs: [
      './js/**/*.js',
      '!./js/polyfill.js'
    ],
    css: temp + 'style.css',
    index: 'index.html',
    js: [
      '*.js'
    ],
    sass: store + '*.scss',
    temp: temp
  };

  return config;
};

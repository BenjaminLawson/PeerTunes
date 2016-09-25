//build PeerTunes for static file distribution
//TODO: minify css, js

var fs = require('fs')
var path = require('path')
var ejs = require('ejs')
var ncp = require('ncp').ncp
var browserify = require('browserify')
var exorcist = require('exorcist')

var views = [
	{
		template: './views/pages/index.ejs', 
		file: 'index.html',
		data: {}
	}
]

//compile views
views.forEach(function (view) {
	ejs.renderFile(view.template, view.data, {}, function(err, str){
    	writeStringToFile(str, './dist/'+view.file)
	})
})

//copy resources
ncp.limit = 16
ncp('./public', './dist', function (err) {
 if (err) {
   return console.error(err);
 }
 console.log('Done copying resources')
 browserifyApp()
})


//browserify app scripts
function browserifyApp () {
	var mapFile = path.join(__dirname, './dist/js/app.js.map')
	/*
	var options = {
		map: '/js/app.js.map',
		include: ['src/*','src/**'],
		exclude: ['node_modules/jsmediatags/**','node_modules/jsmediatags/build2/*.js'],
		output: mapFile //source map
	}

	//{debug: false}
	var bundler = browserify({ debug: true })
	bundler.add('./src/main.js')
	bundler.plugin('minifyify', {map: '/js/app.js.map'})
	bundler.bundle(function (err, src, map) {
	  // Your code here
	  console.log('Done bundling')

	})
	*/
	//.pipe(exorcist(mapFile))
	var appFile = fs.createWriteStream('dist/js/app.js', 'utf8')
	appFile.on('open', function(fd) {
		browserify({debug: true})
	  .add('src/main.js')
	  .bundle()
	  .pipe(exorcist(mapFile))
	  .pipe(appFile)
	})
}



//utility
function writeStringToFile (str, path) {
	fs.writeFile(path, str, function(err) {
	    if(err) {
	        return console.log(err);
	    }

	    console.log('File ', path, ' saved.')
	})
}



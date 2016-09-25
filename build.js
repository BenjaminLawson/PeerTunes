//build PeerTunes for static file distribution
//TODO: minify

var fs = require('fs')
var path = require('path')
var ejs = require('ejs')
var ncp = require('ncp').ncp
var browserify = require('browserify')
var exorcist = require('exorcist')
var UglifyJS = require("uglify-js")

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
	//var mapFile = path.join(__dirname, './dist/js/app.js.map')

	var bundler = browserify('src/main.js')
	bundler.transform({ 
		global: true, 
		ignore: [
    , '**/node_modules/jsmediatags/**'
  	],
		sourcemap: false }, 'uglifyify')
	  .bundle()
	  .pipe(fs.createWriteStream('dist/js/app.js'))
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



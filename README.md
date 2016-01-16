# gulp-shopify-sass
> Concatenate Sass files defined by the @import order

check [this](https://github.com/graygilmore/grunt-shopify-sass) for more info.
This plugin does the same thing but with gulp.

# Installation
install via npm:
	
	npm install gulp-shopify-sass --save-dev


# Example

	var gulp = require('gulp');
	var gss = require('gulp-shopify-sass');
	
	gulp.task('default', function() {
		return gulp.src('./*.scss')
				.pipe(gss());
	});


# License
MIT license
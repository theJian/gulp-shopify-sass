# gulp-shopify-sass [![Build Status](https://travis-ci.org/theJian/gulp-shopify-sass.svg?branch=master)](https://travis-ci.org/theJian/gulp-shopify-sass)
> Concatenate Sass files defined by the @import order

check [this](https://github.com/graygilmore/grunt-shopify-sass) for more info.
This plugin does the same thing but with gulp.

# Installation
install via npm:

	npm install gulp-shopify-sass --save-dev


# Example

To import a file called `_name.scss`, there are four ways to do it.

	@import 'path-to-file/name';
	@import 'path-to-file/_name';
	@import 'path-to-file/name.scss';
	@import 'path-to-file/_name.scss';

All of above will have the same result.


	var gulp = require('gulp');
	var gss = require('gulp-shopify-sass');

	gulp.task('default', function() {
		return gulp.src('./*.scss')
				.pipe(gss());
	});


# License
MIT license
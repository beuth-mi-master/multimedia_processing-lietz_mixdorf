http_path = "/"
css_dir = "css/"
sass_dir = "src/"
images_dir = "img/"
javascripts_dir = "js/"

line_comments = (environment == :production) ? :false : :true

sass_options = {:sourcemaps => true}
output_style = (environment == :production) ? :compressed : :expanded

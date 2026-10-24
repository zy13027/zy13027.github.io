# MathJax is already minified. Copy the downloaded bytes unchanged so the
# upstream integrity hash remains valid after jekyll-terser's generators run.
Jekyll::Hooks.register :site, :post_render do |site|
  next unless site.config.dig('third_party_libraries', 'download')

  path = 'assets/libs/mathjax/tex-mml-chtml.js'
  site.static_files.map! do |file|
    if file.path == File.join(site.source, path)
      Jekyll::StaticFile.new(site, site.source, File.dirname(path), File.basename(path))
    else
      file
    end
  end
end

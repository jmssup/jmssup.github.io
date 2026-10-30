require "cgi"

module BlogFilters
  include Liquid::StandardFilters

  def plain_text(input)
    CGI.unescapeHTML(strip_html(input.to_s)).gsub(/\s+/, " ").strip
  end

  def reading_time(input)
    [(plain_text(input).length / 650.0).ceil, 1].max
  end
end

Liquid::Template.register_filter(BlogFilters)

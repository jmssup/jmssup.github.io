class BlogCategoryPages < Jekyll::Generator
  safe true

  def generate(site)
    site.data.fetch("categories").each do |category|
      id = category.fetch("id")
      page = Jekyll::PageWithoutAFile.new(site, site.source, "categories/#{id}", "index.html")
      page.data["layout"] = "category"
      page.data["title"] = category.fetch("label")
      page.data["category"] = id
      page.data["category_count"] = site.posts.docs.count do |post|
        value = post.data["category"].to_s
        value == id || value.start_with?("#{id}/")
      end
      site.pages << page
    end
  end
end

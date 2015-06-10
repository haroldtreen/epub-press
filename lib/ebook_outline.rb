class EbookOutline

	def initialize(outline = {})
		@outline = outline
	end

	def add_section(section_name)
		@outline[section_name] ||= []
	end

	def add_content(section_name, link)
		if @outline[section_name]
			@outline[section_name].push(link)
		else
			throw 'Section does not exist'
		end
	end

	def sections
		@outline.keys
	end

	def content(section_name)
		@outline[section_name]
	end
end
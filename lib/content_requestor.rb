require 'httparty'

class ContentRequestor
	def self.get(url)
		HTTParty.get(url)
	end
end
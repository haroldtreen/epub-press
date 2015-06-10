require 'spec_helper'
require 'ebook_generator'
require 'ebook_outline'

describe EbookGenerator do
	before(:each) do
		@outline = EbookOutline.new({ 'News' => ['http://article1.com', 'http://article2.com']})
	end

	it 'has a output path' do
		EbookGenerator.output_path = Dir.pwd
		expect(EbookGenerator.output_path).to eq(Dir.pwd)
	end
end
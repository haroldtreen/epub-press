require 'spec_helper'
require 'ebook_outline'

describe EbookOutline do
	before(:each) do
		@ebook_outline = EbookOutline.new()
	end

	it 'has sections' do
		@ebook_outline.add_section('News')
		@ebook_outline.add_section('Sports')

		expect(@ebook_outline.sections).to eq(['News', 'Sports'])
	end

	it 'has content' do
		@ebook_outline.add_section('News')

		@ebook_outline.add_content('News', 'http://google.com')

		@ebook_outline.add_section('News')

		expect(@ebook_outline.content('News')).to eq(['http://google.com'])
	end
end
require 'spec_helper'

require 'content_requestor'
require 'httparty'

describe ContentRequestor do
	it 'can get web content' do
		expect(HTTParty).to receive(:get).with('http://google.com')
		ContentRequestor.get('http://google.com')
	end
end
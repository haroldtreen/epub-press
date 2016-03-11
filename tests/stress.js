const loadtest = require('loadtest');

function statusCallback(latency, result, error) {
    console.log('Current latency %j, result %j', latency, error ? JSON.stringify(error) + result.toString() : result);
    console.log('----');
    console.log('Request elapsed milliseconds: ', error ? error.requestElapsed : result.requestElapsed);
    console.log('Request index: ', error ? error.requestIndex : result.requestIndex);
    console.log('Request loadtest() instance index: ', error ? error.instanceIndex : result.instanceIndex);
}

const options = {
    statusCallback,
    method: 'post',
    concurrency: 6,
    body: {
        urls: [
            'http://www.cbc.ca/news/technology',
            'http://www.cbc.ca/news/canada/calgary/john-ridsdel-hostage-trudeau-1.3487367',
            'http://www.cbc.ca/news/technology/forum-energy-new-technology-jobs-las-vegas-1.3487613',
            'http://www.cbc.ca/news/technology/bangladesh-bank-typo-hack-new-york-fed-1.3485125',
            'http://www.cbc.ca/news/technology/mercury-dark-1.3481517',
            'http://www.cbc.ca/news/technology/esports-cineplex-call-of-duty-tournament-1.3471115',
            'https://www.thestar.com/news/world/2016/03/11/worlds-oldest-man-112-confesses-i-dont-know-the-secret.html',
            'http://www.huffingtonpost.ca/karri-munnvenn/vancouver-climate-declaration_b_9432700.html',
            'http://www.cbc.ca/news/world/germany-islamic-state-files-1.3484861',
            'https://www.thestar.com/news/world/2016/03/11/ben-carson-backs-donald-trump-buries-the-hatchet-with-former-rival.html',
        ],
    },
    url: 'http://epub.press/api/books',
    contentType: 'application/json',
    maxRequests: 300,
};

loadtest.loadTest(options, function(error, result)
{
    if (error)
    {
        return console.error('Got an error: %s', error);
    }
    console.log('Tests run successfully');
});

const loadtest = require('loadtest');

function statusCallback(latency, result, error) {
    console.log('Current latency %j, result %j', latency, error ? JSON.stringify(error) + result.toString() : result);
    console.log('----');
    console.log('Request elapsed milliseconds: ', error ? error.requestElapsed : result.requestElapsed);
    console.log('Request index: ', error ? error.requestIndex : result.requestIndex);
    console.log('Request loadtest() instance index: ', error ? error.instanceIndex : result.instanceIndex);
}

var urls = [
    'https://github.com/injectivejs/injective',
    'http://www.cbc.ca/news/canada/ottawa/workplace-sexual-discrimination-men-heels-union-613-1.3483305?cmp=rss',
    'http://appleinsider.com/articles/16/03/10/apple-issues-sixth-beta-of-tvos-92-for-apple-tv-to-developers',
    'http://appleinsider.com/articles/16/03/10/let-us-loop-you-in-live-apples-march-21-event-will-be-streamed-online',
    'http://www.creativebloq.com/javascript/master-javascript-coding-bundle-21619203',
    'http://www.cbc.ca/news/politics/trudeau-obama-agreements-1.3485496?cmp=rss',
    'http://appleinsider.com/articles/16/03/10/government-says-apple-arguments-in-encryption-case-a-diversion-presents-point-by-point-rebuttle-',
    'http://www.cbc.ca/news/canada/british-columbia/b-c-windstorm-tree-smashes-house-kills-port-moody-woman-in-her-bed-1.3485549?cmp=rss',
    'http://www.cbc.ca/news/politics/canadian-names-reportedly-found-in-trove-of-islamic-state-id-files-1.3485785?cmp=rss',
    'https://github.com/mobxjs/mobx-react-devtools',
    'http://10clouds.com/blog/using-react-instead-of-dijit-with-dojo-toolkit-part-1/',
    'https://www.viget.com/articles/instagram-style-filters-in-html5-canvas',
    'https://forums.meteor.com/t/meteor-com-free-hosting-ends-march-25-2016/19308',
    'http://developers.googleblog.com/2016/03/coffee-with-now-on-tap-pm-paige-dunn.html',
    'http://www.cbc.ca/news/canada/hamilton/news/tim-bosma-trial-dellen-millard-s-uncle-blown-away-by-pet-cremation-suggestion-1.3485222?cmp=rss',
    'http://www.cbc.ca/news/trending/diabetes-sniffing-dog-saves-7-year-old-1.3485101?cmp=rss',
    'http://www.cbc.ca/news/politics/justin-trudeau-us-media-coverage-1.3485939?cmp=rss',
    'http://www.cbc.ca/news/politics/cirillo-ham-gallant-apology-1.3486193?cmp=rss',
    'http://appleinsider.com/articles/16/03/10/apple-counsel-bruce-sewell-calls-doj-filing-cheap-shot-seeking-to-vilify-',
    'http://www.cbc.ca/news/world/carson-trump-endorsement-1.3486305?cmp=rss',
    'http://www.cbc.ca/news/world/republican-debate-miami-march-10-2016-1.3486344?cmp=rss',
    'http://www.cbc.ca/news/canada/toronto/mackenzie-health-sexual-assault-allegations-1.3486005?cmp=rss',
    'https://github.com/sskyy/redux-task',
    'http://www.cbc.ca/news/canada/calgary/red-deer-drivers-license-photo-fight-1.3485399?cmp=rss',
    'http://www.echojs.com/news/18326',
    'http://www.cbc.ca/news/sophie-gr%C3%A9goire-trudeau-canadian-fashion-washington-1.3486020?cmp=rss',
    'http://www.cbc.ca/sports/olympics/winter/curling/brier-thursday-1.3485514?cmp=rss',
    'http://www.cbc.ca/news/world/paul-ryan-republican-nomination-1.3486520?cmp=rss',
    'http://www.cbc.ca/sports/hockey/nhl/canadiens-edge-sabres-lose-p-k-subban-1.3486171?cmp=rss',
    'http://www.cbc.ca/news/canada/isis-documents-canadians-1.3486552?cmp=rss',
    'https://github.com/enricolucia/ng-watcher-checker',
    'http://www.cbc.ca/news/world/rafael-mccloud-fugitive-dead-1.3486581?cmp=rss',
    'http://js-kongress.de/',
    'https://github.com/rlidwka/sinopia',
    'http://www.schibsted.pl/2016/03/20-schibsted-women-why-we-love-working-in-tech/',
    'http://www.cbc.ca/news/world/fukushima-nuclear-disaster-tsunami-five-years-later-1.3480925?cmp=rss',
    'http://www.cbc.ca/news/health/organic-eggs-nutrition-1.3485640?cmp=rss',
    'http://www.cbc.ca/news/business/february-jobs-advancer-1.3485603?cmp=rss',
    'http://www.cbc.ca/news/politics/hall-trudeau-obama-bromance-1.3486409?cmp=rss',
    'http://www.cbc.ca/news/canada/north/trudeau-obama-washington-visit-arctic-promises-1.3486076?cmp=rss'
];

// function(params, options, client, callback) {
//     request = client(options, callback);
//
//     if (message)
//     {
//       options.headers['Content-Length'] = message.length;
//       options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
//       request.write(message);
//     }
//
//     request.end();
// }


const options = {
    statusCallback,
    // requestGenerator,
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
    url: 'http://104.154.19.246/api/books',
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
	console.log(result);
});

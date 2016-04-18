[].forEach.call(document.querySelectorAll('td.title > a'), function(elem) {
    window.open(elem.href);
});

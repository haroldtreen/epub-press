[].forEach.call(document.querySelectorAll('td.title > a'), (elem) => {
    window.open(elem.href);
});

# FAQ

### <a id="other-services"></a>Q: How is this different from Readability, Instapaper, Pocket, dotEpub, etc.?
**EpubPress**
- Single .epub file.
- Ability to bulk-select articles using the [Chrome Extension](https://chrome.google.com/webstore/detail/epubpress/pnhdnpnnffpijjbnhnipkehhibchdeok)
- Allows you to combine content from all kinds of sources.
- Custom title and descriptions.
- No signup required. Supported through [donations](#donate).

**Other Services**
- Each article represented on your device as a separate book.
- Pages need to be sent one by one.
- No ability to customize ebook.
- Require accounts. Supported through premium pricing.

### Q: EpubPress was unable to find content for a page. What does that mean?

It usually means one of two things:
- The page you sent didn't have a large body body text that EpubPress thought would be good for a book. (eg. Sending a YouTube video or page of images)
- The content you were hoping to extract was in a part of the page that EpubPress considered irrelevant and was removed (eg. Sending a comment thread)

If you are a publisher and want to make your page easier to extract content from, follow the [Readability Publishing Guidelines](https://web.archive.org/web/20161001/https://readability.com/developers/guidelines#publisher).
If you find a page that isn't being extracted properly, don't hesitate to email [support@epub.press](mailto:support@epub.press)

### Q: I tried email delivery, but my book never arrived. What's going on?

- Check your spam.
- Verify you entered the correct email.
- Try creating the book again and make sure that EpubPress returns success.
- If you have a lot of pages in your book, the result may be too big to email. Try removing your email and downloading instead.

### Q: What are the limitations of EpubPress?

- Books are limited to containing **50 articles**.
- Books must be **10 Mb or less** for email delivery to work.
- Images in an article must be **1 Mb or less**. Images that exceed this limit will be removed.
- No more than **30 images** will be downloaded.

### Q: Is EpubPress available for other platforms?

EpubPress client are planned for a variety of platforms. To see the development status of different clients, visit the [Github repo](https://github.com/haroldtreen/epub-press-clients).

### <a id="donate"></a>Q: How does EpubPress keep the lights on?

Currently EpubPress is a free tool I've developed in my spare time. Hosting this service is paid for entirely out of my own pocket.

You can help keep EpubPress alive with your donations.
[Similar services](#other-services) operate off premium pricing between **[3](https://www.instapaper.com/premium)- [6](http://sendtoreader.com/pricing/) $/month**, but all contributions are appreciated! ❤

### Credit Card/Paypal
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick">
<input type="hidden" name="hosted_button_id" value="WPPGUUWZSFASU">
<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
</form>

### Bitcoin
<script src="https://gateway.gear.mycelium.com/gear-widget-host.js"></script>
<iframe id="gear-widget" scrolling="no" src="https://gateway.gear.mycelium.com/widgets/c0a5bcfdcc07f8722c763d64cfeaadf65904cbd03152f12e0687fab6a21b29ab" style="border: none; display: inline-block; height: 130px; min-width: 250px; max-width: 350px;"></iframe>

# Privacy Policy
EpubPress has no way of tracking who is creating ebooks.

When a book is created, the html from your selected tabs will be sent to a server for publishing into an ebook.
When an ebook is requested, your email will be sent to the server if provided. This is necessary for email delivery and will not be used for any other purposes.

If no email is provided, the ebook will be returned as a file and no information about who requested the book will be saved.

All extension code is [available here](https://github.com/haroldtreen/epub-press-chrome).  
All backend code is [available here](https://github.com/haroldtreen/epub-press).

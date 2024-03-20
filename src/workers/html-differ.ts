import HtmlDiff from 'htmldiff-ts';

self.onmessage = (event: { data: { baseHtml: string; currentHtml: string } }) => {
    const diffHtml = HtmlDiff.create(event.data.baseHtml, event.data.currentHtml).build();

    self.postMessage(diffHtml);
};

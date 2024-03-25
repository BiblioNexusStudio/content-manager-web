import HtmlDiff from 'htmldiff-ts';

self.onmessage = (event: { data: { baseHtml: string; currentHtml: string } }) => {
    try {
        const diffHtml = HtmlDiff.create(event.data.baseHtml, event.data.currentHtml).build();
        self.postMessage({ success: diffHtml });
    } catch (error) {
        self.postMessage({ error });
    }
};

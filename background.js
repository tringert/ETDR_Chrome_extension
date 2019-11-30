var urlRegex = /^https?:\/\/(?:[^./?#]+\.)?etdr\.gov\.hu\/(RDProcessAction\/ProcessActionEdit|RDProcessByUser\/ProcessEdit|ProcessByOffice\/ProcessEdit|ProcessAction\/ProcessActionEdit)/;
var devEnvRegex = /^https?:\/\/(?:[^./?#]+\.)?fejl\.etdr\.gov\.hu\/(RDProcessAction\/ProcessActionEdit|RDProcessByUser\/ProcessEdit|ProcessByOffice\/ProcessEdit|ProcessAction\/ProcessActionEdit)/;
var isDevEnv = new Boolean(false);

// A function to use as callback
function doStuffWithDom(jsonData) {
    var infos = JSON.parse(jsonData);

    // Set the folder name
    var downloadPrefix = infos.processNumber === "" ? "" : infos.processNumber.replace("/", "_") + "/";

    for (i = 0; i < infos.loc.length; i++) {

        if (isDevEnv) {
            infos.loc[i].link = infos.loc[i].link.replace('www.etdr.gov.hu', 'fejl.etdr.gov.hu');
        }

        downloading = chrome.downloads.download({
            url: infos.loc[i].link,
            filename: downloadPrefix + infos.loc[i].filename,
            conflictAction: 'uniquify'
        });
    }

    isDevEnv = false;
}

// When the browser-action button is clicked...
chrome.browserAction.onClicked.addListener(function (tab) {

    // When started in the development environment we need to change the download url
    if (devEnvRegex.test(tab.url)) {
        isDevEnv = true;
    }

    // ...check the URL of the active tab against our pattern and...
    if (urlRegex.test(tab.url)) {
        // ...if it matches, send a message specifying a callback too
        chrome.tabs.sendMessage(tab.id, { text: 'report_back' }, doStuffWithDom);
    }
});
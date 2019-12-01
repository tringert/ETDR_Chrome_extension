var urlRegex = /^https?:\/\/(?:[^./?#]+\.)?etdr\.gov\.hu\/(RDProcessAction\/ProcessActionEdit|RDProcessByUser\/ProcessEdit|ProcessByOffice\/ProcessEdit|ProcessAction\/ProcessActionEdit)/;
var devEnvRegex = /^https?:\/\/(?:[^./?#]+\.)?fejl\.etdr\.gov\.hu\/(RDProcessAction\/ProcessActionEdit|RDProcessByUser\/ProcessEdit|ProcessByOffice\/ProcessEdit|ProcessAction\/ProcessActionEdit)/;
var isDevEnv = new Boolean(false);

// A function to use as callback
function doStuffWithDom(jsonData) {
    var infos = JSON.parse(jsonData);

    // Set the folder name
    var downloadFolder = "# Letöltött ÉTDR dokumentumok/";
    var downloadPrefix = infos.processNumber === ""
        ? downloadFolder + currentDateTimeAsFolderName()
        : downloadFolder + infos.processNumber.replace("/", "_") + "/";

    for (var i = 0; i < infos.loc.length; i++) {

        if (isDevEnv) {
            infos.loc[i].link = infos.loc[i].link.replace('www.etdr.gov.hu', 'fejl.etdr.gov.hu');
        }

        var downloading = chrome.downloads.download({
            url: infos.loc[i].link,
            filename: downloadPrefix + infos.loc[i].filename,
            conflictAction: 'uniquify'
        });
    }

    isDevEnv = false;

    // Get the local storage to determine if a new install or an update occured
    var gettingItem = chrome.storage.local.get(["ETDR_ExtVersion", "ETDR_ShowChangeLog"], function (res) {
        detectVersionChange(res.ETDR_ExtVersion, res.ETDR_ShowChangeLog);
    });
}

// When a new install or an update occured, show a changelog page to the user
function detectVersionChange(storedVersion, showChangelog) {
    // Get the extensions actual version from the manifest file
    var extVersion = chrome.runtime.getManifest().version.replace(/\./g, "");

    // Check if the extension's version is stored in the local storage and if it is older than the current one. If yes, then store it and set to show the changelog.
    if (storedVersion === undefined || storedVersion < extVersion) {
        storeCurrentVersion(extVersion);
        storeShowChangelog(true);
        showChangelog = true;
    }

    // If the showing the changelog window isn't stored in the local storage, then store it and set it to show
    if (showChangelog === undefined) {
        storeShowChangelog(true);
        showChangelog = true;
    }

    // Show the changelog if necessary and store that next time the changelog window won't be displayed
    if (showChangelog) {
        openChangelog();
        storeShowChangelog(false);
    }
}

// Changelog window show value store
function storeShowChangelog(value) {
    chrome.storage.local.set({
        ETDR_ShowChangeLog: value
    });
}

// Current extension's version store
function storeCurrentVersion(value) {
    chrome.storage.local.set({
        ETDR_ExtVersion: value
    });
}

function openChangelog() {
    let page = {
        type: "popup",
        url: "backgroundpage.html",
        width: 800,
        height: 400
    };

    let creating = chrome.windows.create(page);
}

function currentDateTimeAsFolderName() {
    var dt = new Date();
    var year = dt.getFullYear().toString();
    var month = dt.getMonth().toString();
    var day = dt.getDay().toString();
    var hour = dt.getHours().toString();
    var minutes = dt.getMinutes().toString();
    var seconds = dt.getSeconds().toString();

    return `${year}.${month}.${day}_${hour + minutes + seconds}/`;
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

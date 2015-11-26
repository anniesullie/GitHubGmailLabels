// To create an access token, go to https://github.com/settings/tokens/new
// You do NOT need any write permissions, public_repo only should be fine.
// This script will sometimes work without an access token, but it may be
// throttled.
var ACCESS_TOKEN = null;

// Add an entry to this custom mapping for each label you want to see added to
// your Gmail messages.
// Key: github label.
// Value: Gmail label.
// Labels not in this list will automatically be mapped to project/label
// in Gmail
// Custom mapping can also include project names.
var CUSTOM_MAPPING = {
  // 'P0': 'p0',
  // 'P1': 'p1',
  // 'Project-A/myproject' : 'My Project',
};

// Set this to true to ignore any labels not mentioned in the custom labels.
var strict_mode = false;

// Returns a Gmail label if one already exists, otherwise creates a new one.
function getOrCreateLabel(labelName) {
  var label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
  }
  return label;
}

// Add a time-driven trigger to run this function as often as you'd like your
// mails to be auto-labeled. Documentation on time-based triggers:
// https://developers.google.com/apps-script/guides/triggers/installable#managing_triggers_manually
function updateNewGithubNotificationThreadLabels() {
  // There isn't a built-in way for an apps script to just check all the emails
  // since it last ran. So we do a search for GitHub notification mails from the
  // last day, and store a property with info about the ones that haven't
  // changed.
  var threads = GmailApp.search('from:notifications@github.com newer_than:1d');
  var seenThreads = JSON.parse(
      PropertiesService.getUserProperties().getProperty('seenThreads') || '{}');
  for (var i = 0; i < threads.length; i++) {
    // Check if this thread has been processed before and update the cache.
    var threadId = threads[i].getId();
    var threadTime = String(threads[i].getLastMessageDate());
    if (seenThreads[threadId] == threadTime) {
      // Already applied labels to this thread, no updates since then.
      continue;
    }
    seenThreads[threadId] = threadTime;
    var thread = threads[i];
    
    // Parse the thread subject to get the GitHub issue id.
    var subject = thread.getFirstMessageSubject();
    var match = subject.match(/.*\(#([\d]+)\)/);
    if (match) {
      // This thread has an issue id, so it must be about a bug.
      var issueId = match[1];
      
      // Parse the to: field of the first message to get the GitHub project/repo.
      // Unfortunately there is no API for getting a single message so need to
      // pull all of them.
      var messages = thread.getMessages();
      var project = messages[0].getTo().match(/(.*) \</)[1];
      
      // From the issue id and project, create a GitHub API request for more
      // info about the issue. If an access token exists, include it in the
      // request for higher usage quota.
      var url = 'https://api.github.com/repos/%PROJ%/issues/%ID%'.
          replace('%PROJ%', project).
          replace('%ID%', issueId);
      var params = {};
      if (ACCESS_TOKEN) {
        params['headers'] = {'Authorization': 'token ' + ACCESS_TOKEN}
      }
      var response = UrlFetchApp.fetch(url, params);
      
      // Parse the issue info. Currently, this script just parses the issue
      // label and updates Gmail labels accordingly. But it could potentially
      // parse anything available throug the GitHub API, which is documented
      // here:
      // https://developer.github.com/v3/issues/#get-a-single-issue
      // And it could potentially take more actions on the thread in Gmail, like
      // archiving or changing read/important state.
      var issueInfo = JSON.parse(response.getContentText());
      var labels = issueInfo['labels'];
      for (var j = 0; j < labels.length; j++) {
        var labelName = CUSTOM_MAPPING[labels[j]['name']] ?
                        CUSTOM_MAPPING[labels[j]['name']] : labels[j]['name'];
        if (!labelName && strict_mode)
          continue;
        else {
          var projectName = CUSTOM_MAPPING[project] ?
                            CUSTOM_MAPPING[project] : project;
          getOrCreateLabel(projectName);
          labelName = projectName + '/' + labelName;
        }
        thread.addLabel(getOrCreateLabel(labelName));
      }
    }
  }
  PropertiesService.getUserProperties().setProperty(
      'seenThreads', JSON.stringify(seenThreads));
}
# GitHubGmailLabels
This is a Google Apps Script that updates Gmail labels for GitHub notification mails based on their corresponding GitHub issue tracker labels.

## Setup
1. Go to [script.google.com](https://script.google.com). It will automatically create a new script. Paste in this script from UpdateLabels.gs.
2. Edit the CUSTOM_MAPPING variable to establish a mapping between GitHub issue labels and Gmail labels.
3. Add the Gmail labels that you want to be marked as important in the MARK_IMPORTANT list. (note these are the Gmail labels and not the GitHub labels)
3. Set either to use a strict_mode or not, if not using strict_mode: All other labels will be mapped as is under a project label.
4. (Optional, but recommended) [Create a GitHub access token](https://github.com/settings/tokens/new) and paste its value into the ACCESS_TOKEN variable. This will increase the rate limit on API calls.
5. Name and save your script.
6. [Install a time-driven trigger](https://developers.google.com/apps-script/guides/triggers/installable#managing_triggers_manually) by clicking on the clock button, clicking "Click here to add one now", and configuring how often you want the script to run.

## Future work
I haven't had time to look at the way apps scripts are published to make this installable, and whether it could be configurable if it was installable.

I think the same approach could also be used to label mails from crbug and rietveld.

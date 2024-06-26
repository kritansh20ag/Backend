# Reach Inbox Intern Backend

This repository contains the backend code for the Reach Inbox Intern project.

## Prerequisites

Before running this project, make sure you have the following installed on your system:
- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. **Clone the repository:**

   git clone https://github.com/kritansh20ag/reachinbox.git
   cd reachinbox/Backend
2.  **Install Dependencies**
   npm install


  **Usage**
 1.Start the application:
 write the command "nodemon index.js" in your terminal
 2. Authentication:
 **Google OAuth***:

Navigate to http://localhost:3030/auth/google to authenticate with Google.
Grant necessary permissions for Gmail access.

**Outlook OAuth**:

Navigate to http://localhost:3030/auth/outlook to authenticate with Outlook.
Follow the prompts to authenticate and grant permissions.

3. Functionality:

a)The application fetches unread emails from Gmail.
b)Utilizes OpenAI for email processing to determine the state and generate replies.
c)Replies are sent using Gmail API and emails are marked as read.

**Files**
gmailclient.js: Contains functions for sending email replies using Google Gmail API.
openaiClient.js: Integrates with OpenAI to process email snippets and generate responses.
outlookAuth.js: Configures Microsoft Azure Active Directory for Outlook authentication.
index.js: Main application file setting up Express server, handling OAuth flows, and email processing,googleOauth.

**for google Oauth you can use the email id
id-kritanshagarwal567@gmail.com
password-kritansh20@**

 
   

   
